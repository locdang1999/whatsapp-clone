import ConversationScreen from '@/components/ConversationScreen'
import Sidebar from '@/components/Sidebar'
import { auth, db } from '@/config/firebase.config'
import { Conversation, IMessage } from '@/types'
import { generateQueryMessages, transformMessage } from '@/utils/generateQueryMessages'
import { getRecipientEmail } from '@/utils/getRecipientEmail'
import { doc, getDoc, getDocs } from 'firebase/firestore'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import React from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import styled from 'styled-components'

const StyledContainer = styled.div`
display: flex;
`

const StyledConversationContainer = styled.div`
flex-grow: 1;
overflow: scroll;
height: 100vh;
&::-webkit-scrollbar {
display: none;
/* width: 10px; */
}
/* Hide scrollbar for IE, Edge and Firefox */
-ms-overflow-style: none; /* IE and Edge */
scrollbar-width: none; /* Firefox */
`

interface Props {
    conversation: Conversation
    messages: IMessage[]
}

const Conversations = ({ conversation, messages }: Props) => {
    const [loggedInUser, _loading, _error] = useAuthState(auth);
    return (
        <StyledContainer>
            <Head>
                <title>
                    Conversation with {getRecipientEmail(conversation.users, loggedInUser)}
                </title>
            </Head>
            <Sidebar />
            <StyledConversationContainer>
                <ConversationScreen conversation={conversation} messages={messages} />
            </StyledConversationContainer>
        </StyledContainer>
    )
}

export default Conversations

export const getServerSideProps: GetServerSideProps<Props, { id: string }> = async (context) => {
    const conversationId = context.params?.id

    // Get conversation, to know who we are chatting with
    const conversationRef = doc(db, 'conversations', conversationId as string);
    const conversationSnapshot = await getDoc(conversationRef);

    // Get all messages between logged in user and recipient in this this conversation
    const queryMessage = generateQueryMessages(conversationId);

    const messagesSnapshot = await getDocs(queryMessage);

    const messages = messagesSnapshot.docs.map(messageDoc => transformMessage(messageDoc))

    return {
        props: {
            conversation: conversationSnapshot.data() as Conversation,
            messages
        }
    }
}