import Avatar from "@mui/material/Avatar"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import Tooltip from "@mui/material/Tooltip"
import styled from "styled-components"
import ChatIcon from "@mui/icons-material/Chat"
import MoreVerticalIcon from "@mui/icons-material/MoreVert"
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import LogoutIcon from "@mui/icons-material/Logout"
import SearchIcon from "@mui/icons-material/Search"
import { signOut } from "firebase/auth"
import { auth, db } from "@/config/firebase.config"
import { useAuthState } from "react-firebase-hooks/auth"
import { useState } from "react"
import * as EmailValidator from "email-validator"
import { addDoc, collection, query, where } from "firebase/firestore"
import { useCollection } from 'react-firebase-hooks/firestore';
import { Conversation } from "@/types"
import ConversationSelect from "./ConversationSelect"

const StyledContainer = styled.div`
height: 100vh;
min-width: 300px;
max-width: 350px;
overflow-y: scroll;
border-right: 1px solid whitesmoke;
/* Hide scrollbar for Chrome, Safari and Opera */
&::-webkit-scrollbar {
	display: none;
    /* width: 10px; */
}
/* &::-webkit-scrollbar-thumb{
    border-radius: 10px;
} */
/* Hide scrollbar for IE, Edge and Firefox */
-ms-overflow-style: none; /* IE and Edge */
scrollbar-width: none; /* Firefox */
`

const StyledHeader = styled.div`
display: flex;
justify-content: space-between;
align-items: center;
padding: 10px;
height: 80px;
border-bottom: 1px solid whitesmoke;
position: sticky;
top: 0;
background-color: white;
z-index: 1;
`

const StyledSearch = styled.div`
display: flex;
align-items: center;
padding: 15px;
border-radius: 2px;
`

const StyledSearchInput = styled.input`
outline: none;
border: none;
flex: 1;
`

const StyledSideBarButton = styled(Button)`
width: 100%;
border-top: 1px solid whitesmoke;
border-bottom: 1px solid whitesmoke;
`

const StyledUserAvatar = styled(Avatar)`
cursor: pointer;
:hover{
    opacity:0.8
}
`

const Sidebar = () => {
    const [loggedInUser, _loading, _error] = useAuthState(auth);
    const [isOpenNewConverDialog, setIsOpenNewConverDialog] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState('');

    const toggleNewConversationDialog = (isOpen: boolean) => {
        setIsOpenNewConverDialog(isOpen);

        if (!isOpen) {
            setRecipientEmail('');
        }
    }

    const closeToggleNCDl = () => {
        setIsOpenNewConverDialog(false);
    }

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.log('ERROR LOGGING OUT', error)
        }
    }

    //Check if conversation already exists between the current
    const queryGetConversationsForCurrentUser = query(collection(db, 'conversations'), where('users', 'array-contains', loggedInUser?.email));
    const [conversationSnapshot, __loading, __error] = useCollection(queryGetConversationsForCurrentUser);

    const isConversationAlreadyExists = (recipientEmail: string) => {
        return conversationSnapshot?.docs.find(conversation => (conversation.data() as Conversation).users.includes(recipientEmail))
    }

    const isInvitingSelf = recipientEmail === loggedInUser?.email

    const createConversation = async () => {
        if (!recipientEmail) return;
        if (EmailValidator.validate(recipientEmail) && !isInvitingSelf && !isConversationAlreadyExists(recipientEmail)) {
            // Add conversation user to DB "conversation" collection
            // A conversation is between the currently logged in user and the user invited
            await addDoc(collection(db, 'conversations'), {
                users: [loggedInUser?.email, recipientEmail]
            })
        }
        closeToggleNCDl();
    }

    return (
        <StyledContainer>
            <StyledHeader className="test">
                <Tooltip title={loggedInUser?.email as string} placement='right'>
                    <StyledUserAvatar src={loggedInUser?.photoURL as string || ''} />
                </Tooltip >
                <div>
                    <IconButton>
                        <ChatIcon />
                    </IconButton>
                    <IconButton>
                        <MoreVerticalIcon />
                    </IconButton>
                    <IconButton onClick={logout}>
                        <LogoutIcon />
                    </IconButton>
                </div>
            </StyledHeader>
            <StyledSearch>
                <SearchIcon />
                <StyledSearchInput placeholder="Search in conversations" />
            </StyledSearch>
            <StyledSideBarButton onClick={() => toggleNewConversationDialog(true)}>Start a new conversation</StyledSideBarButton>
            {/* List of conversations */}
            {
                conversationSnapshot?.docs.map((conversation) => <ConversationSelect
                    key={conversation.id}
                    id={conversation.id as string}
                    conversationUser={(conversation.data() as Conversation).users} />)
            }
            <Dialog open={isOpenNewConverDialog} onClose={closeToggleNCDl}>
                <DialogTitle>New Conversation</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter a Google email address for the user you wish to chat with
                    </DialogContentText>
                    <TextField
                        autoFocus
                        label="Email Address"
                        type="email"
                        fullWidth
                        variant="standard"
                        value={recipientEmail}
                        onChange={(e) => {
                            setRecipientEmail(e.target.value)
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeToggleNCDl}>Cancel</Button>
                    <Button disabled={!recipientEmail} onClick={createConversation}>Create</Button>
                </DialogActions>
            </Dialog>
        </StyledContainer >
    )
}

export default Sidebar