import { UseRecipientReturnType } from '@/types'
import React from 'react'
import Avatar from '@mui/material/Avatar';
import styled from 'styled-components';

type Props = UseRecipientReturnType;

const StyledAvatar = styled(Avatar)`
margin: 5px 15px 5px 15px;
`

const RecipientAvatar = ({ recipient, recipientEmail }: Props) => {
    return recipient?.photoURL ? (
        <StyledAvatar src={recipient?.photoURL} />
    ) : (<StyledAvatar>{recipientEmail && recipientEmail[0].toUpperCase()}</StyledAvatar>)
}

export default RecipientAvatar