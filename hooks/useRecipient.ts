import { auth, db } from "@/config/firebase.config";
import { AppUser, Conversation } from "@/types";
import { getRecipientEmail } from "@/utils/getRecipientEmail";
import { collection, query, where } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollection } from "react-firebase-hooks/firestore";

export const useRecipient = (conversationUsers: Conversation['users']) =>{
    const [loggedInUser, _loading, _error] = useAuthState(auth);

    // Get recipient Email
    const recipientEmail = getRecipientEmail(conversationUsers, loggedInUser);

    // Get recipient Avatar
    const queryGetRecipient = query(collection(db, 'users'), where('email', '==', recipientEmail));
    const [recipientSnapshot, __loading, __error] = useCollection(queryGetRecipient);

    // RecipientSnapshot?.docs could be an qempty array
    // So we have to force "?" after docs[0] because there is no data() on "undefined"
    const recipient = recipientSnapshot?.docs[0]?.data() as AppUser | undefined;

    return {
        recipientEmail,
        recipient
    }
}