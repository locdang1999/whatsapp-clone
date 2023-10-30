import { Conversation } from "@/types";
import { User } from "firebase/auth";

export const getRecipientEmail = (conversationUser: Conversation['users'], loggedInUser?: User | null) => {
    return conversationUser.find((userEmail) => userEmail !== loggedInUser?.email)
}