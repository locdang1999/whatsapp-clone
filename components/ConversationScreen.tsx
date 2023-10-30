import { useRecipient } from '@/hooks/useRecipient';
import { Conversation, IMessage } from '@/types'
import React, { KeyboardEventHandler, MouseEventHandler, useRef, useState } from 'react'
import styled from 'styled-components';
import RecipientAvatar from './RecipientAvatar';
import { convertFirestoreTimestampToString, generateQueryMessages, transformMessage } from '@/utils/generateQueryMessages';
import IconButton from '@mui/material/IconButton';
import AttachFileIcon from "@mui/icons-material/AttachFile"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon"
import SendIcon from "@mui/icons-material/Send"
import MicIcon from "@mui/icons-material/Mic"
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/config/firebase.config';
import { useCollection } from 'react-firebase-hooks/firestore';
import Message from './Message';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';

const StyledRecipientHeader = styled.div`
position: sticky;
background-color: white;
z-index: 100;
top: 0;
display: flex;
align-items: center;
padding: 10px;
height: 80px;
border-bottom: 1px solid whitesmoke;
`

const StyledHeaderInfo = styled.div`
/* margin-left: 15px; */
flex-grow: 1;
>h3{
    margin-top: 0;
    margin-bottom: 3px
}
>span{
    font-size: 14px;
    color: gray;
}
`

const StyledH3 = styled.h3`
    word-break: break-all;
`

const StyledHeaderIcons = styled.div`
    display: flex;
`

const StyledMessageContainer = styled.div`
    padding: 30px;
    background-color: #e5ded8;
    min-height: 90vh;
`

const StyledInputContainer = styled.form`
display: flex;
align-items: center;
padding: 10px;
position: sticky;
bottom: 0;
background-color: white;
z-index: 100;
`

const StyledInput = styled.input`
    flex-grow: 1;
    outline: none;
    border: none;
    border-radius: 10px;
    background-color: whitesmoke;
    padding: 15px;
    margin-left: 15px;
`

const EndOfMessageForAutoScroll = styled.div`
margin-bottom:30px;
`

const ConversationScreen = ({ conversation, messages }: { conversation: Conversation, messages: IMessage[] }) => {
    const [loggedInUser, _loading, _error] = useAuthState(auth);
    const [newMessage, setNewMessage] = useState('');
    const conversationUsers = conversation.users;
    const { recipientEmail, recipient } = useRecipient(conversationUsers);
    const router = useRouter();
    const conversationId = router.query.id; //get id url
    const queryGetMessages = generateQueryMessages(conversationId as string);
    const [messageSnapshot, messagesLoading, __error] = useCollection(queryGetMessages);

    const showMessage = () => {
        // If front-end is loading messages behind the scenes, display messages retrieved from Next SSR (passed down form [id].tsx)
        if (messagesLoading) {
            return messages.map((message, idx) => <Message key={idx} message={message} />)
        }
        //If front-end has finished loading messages, so now we have messagesSnapshot
        if (messageSnapshot) {
            return messageSnapshot.docs.map((message, idx) => <Message key={idx} message={transformMessage(message)} />)
        }

        return null
    }

    const addMessageToDbAndUpdateLastSeen = async () => {
        // Update last seen in 'Users' collection
        await setDoc(doc(db, 'users', loggedInUser?.email as string), {
            lastSeen: serverTimestamp()
        }, { merge: true })// just update what is changed

        // Add new message to 'messages' collection
        await addDoc(collection(db, 'messages'), {
            conversation_id: conversationId,
            sent_at: serverTimestamp(),
            text: newMessage,
            user: loggedInUser?.email
        })

        // reset input field
        setNewMessage('');

        //scroll to bottom
        scrollToBottom()
    }

    const sendMessageOnEnter: KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!newMessage) return;
            addMessageToDbAndUpdateLastSeen();
        }
    }

    const sendMessageOnClick: MouseEventHandler<HTMLButtonElement> = (e) => {
        e.preventDefault();
        if (!newMessage) return;
        addMessageToDbAndUpdateLastSeen();
        scrollToBottom();
    }

    const endOfMessagesRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
        console.log("first")
    }

    return (
        <>
            <StyledRecipientHeader>
                <RecipientAvatar recipient={recipient} recipientEmail={recipientEmail} />

                <StyledHeaderInfo >
                    <StyledH3>
                        {recipientEmail}
                    </StyledH3>
                    {recipient && <span>Last active: {convertFirestoreTimestampToString(recipient.lastSeen)}</span>}
                </StyledHeaderInfo>
                <StyledHeaderIcons>
                    <IconButton>
                        <AttachFileIcon />
                    </IconButton>
                    <IconButton>
                        <MoreVertIcon />
                    </IconButton>
                </StyledHeaderIcons>
            </StyledRecipientHeader>

            <StyledMessageContainer>
                {showMessage()}
                {/* for auto scroll to the end when a new message is sent */}
                <EndOfMessageForAutoScroll ref={endOfMessagesRef} />
            </StyledMessageContainer>
            {/* <EndOfMessageForAutoScroll ref={endOfMessagesRef} /> */}
            {/*Enter new Message */}
            <StyledInputContainer>
                <InsertEmoticonIcon />
                <StyledInput value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={sendMessageOnEnter} />
                <IconButton onClick={sendMessageOnClick} disabled={!newMessage}>
                    <SendIcon />
                </IconButton>
                <IconButton>
                    <MicIcon />
                </IconButton>
            </StyledInputContainer>
        </>
    )
}

export default ConversationScreen