/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import {setGlobalOptions} from "firebase-functions";
import {
  beforeUserCreated, beforeEmailSent,
} from "firebase-functions/v2/identity";
import {getAuth} from "firebase-admin/auth";
import {HttpsError} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
// setGlobalOptions({ maxInstances: 1 });

initializeApp();

// https://firebase.google.com/docs/functions/auth-blocking-events
export const beforecreated = beforeUserCreated(
  {maxInstances: 1}, async (event) => {
    const user = event.data;
    const email = user?.email;
    if (!email) {
      throw new HttpsError("invalid-argument", "Missing email");
    }
    const db = getFirestore();
    const docRef = db.collection("allowed-emails").doc(email);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new HttpsError("invalid-argument", "Unauthorized email");
    }
    // If admin field is true, assign admin claim
    const allowedData = doc.data();
    docRef.delete();
    return {customClaims: {admin: allowedData?.admin ?? false}};
  });

export const beforeemailsent = beforeEmailSent(
  {maxInstances: 1}, async (event) => {
    const email = event.additionalUserInfo?.email;
    if (!email) {
      throw new HttpsError("invalid-argument", "Missing email");
    }

    // Check if account already exists
    try {
      const auth = getAuth();
      const existingUser = await auth.getUserByEmail(email);
      if (!existingUser) {
        throw new HttpsError("internal", "Existing user object missing");
      }
      return {};
    } catch (err: any) {
      // If error is user-not-found, check allowed emails
      if (err.code === "auth/user-not-found") {
        const db = getFirestore();
        const doc = await db.collection("allowed-emails").doc(email).get();
        if (!doc.exists) {
          throw new HttpsError("invalid-argument", "Unauthorized email");
        }
        return {};
      } else {
        throw err;
      }
    }
  });
