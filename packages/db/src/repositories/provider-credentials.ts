import { and, asc, eq } from "drizzle-orm";
import { db, type Database } from "../client";
import { providerCredentials } from "../schema";

export interface ProviderCredentialEnvelopeInput {
  providerId: string;
  ciphertext: string;
  initializationVector: string;
  authenticationTag: string;
  encryptionVersion: number;
  credentialHint: string;
}

export function createProviderCredentialRepository(database: Database = db) {
  return {
    async list(ownerId: string) {
      return database
        .select({
          providerId: providerCredentials.providerId,
          credentialHint: providerCredentials.credentialHint,
          updatedAt: providerCredentials.updatedAt,
        })
        .from(providerCredentials)
        .where(eq(providerCredentials.ownerId, ownerId))
        .orderBy(asc(providerCredentials.providerId));
    },

    async find(ownerId: string, providerId: string) {
      const [credential] = await database
        .select()
        .from(providerCredentials)
        .where(
          and(
            eq(providerCredentials.ownerId, ownerId),
            eq(providerCredentials.providerId, providerId),
          ),
        )
        .limit(1);
      return credential ?? null;
    },

    async upsert(ownerId: string, input: ProviderCredentialEnvelopeInput) {
      const [credential] = await database
        .insert(providerCredentials)
        .values({ ownerId, ...input })
        .onConflictDoUpdate({
          target: [providerCredentials.ownerId, providerCredentials.providerId],
          set: {
            ciphertext: input.ciphertext,
            initializationVector: input.initializationVector,
            authenticationTag: input.authenticationTag,
            encryptionVersion: input.encryptionVersion,
            credentialHint: input.credentialHint,
            updatedAt: new Date(),
          },
        })
        .returning({
          providerId: providerCredentials.providerId,
          credentialHint: providerCredentials.credentialHint,
          updatedAt: providerCredentials.updatedAt,
        });
      if (!credential) throw new Error("Provider credential could not be stored.");
      return credential;
    },

    async delete(ownerId: string, providerId: string) {
      const deleted = await database
        .delete(providerCredentials)
        .where(
          and(
            eq(providerCredentials.ownerId, ownerId),
            eq(providerCredentials.providerId, providerId),
          ),
        )
        .returning({ id: providerCredentials.id });
      return deleted.length === 1;
    },
  };
}

export const providerCredentialRepository = createProviderCredentialRepository();
