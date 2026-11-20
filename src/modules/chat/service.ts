import { ChatServiceError } from './errors';
import { contactService } from './services/contact.service';
import { messageService } from './services/message.service';
import { roomService } from './services/room.service';

export { ChatServiceError, contactService, messageService, roomService };

export class ChatService {
    isBlockedBetween = contactService.isBlockedBetween.bind(contactService);
    searchUsers = contactService.searchUsers.bind(contactService);
    getInvitePreview = contactService.getInvitePreview.bind(contactService);
    addFriendship = contactService.addFriendship.bind(contactService);
    cancelFriendRequest = contactService.cancelFriendRequest.bind(contactService);
    blockUser = contactService.blockUser.bind(contactService);
    unblockUser = contactService.unblockUser.bind(contactService);
    getBlockedUsers = contactService.getBlockedUsers.bind(contactService);
    getFriendship = contactService.getFriendship.bind(contactService);
    updateStatusFriendship = contactService.updateStatusFriendship.bind(contactService);
    getContacts = contactService.getContacts.bind(contactService);
    getAllOtherUsers = contactService.getAllOtherUsers.bind(contactService);

    isUserInRoom = roomService.isUserInRoom.bind(roomService);
    getOrCreateDirectRoom = roomService.getOrCreateDirectRoom.bind(roomService);
    createGroupRoom = roomService.createGroupRoom.bind(roomService);
    getGroupDetails = roomService.getGroupDetails.bind(roomService);
    addGroupMember = roomService.addGroupMember.bind(roomService);
    removeGroupMember = roomService.removeGroupMember.bind(roomService);
    markRoomAsRead = roomService.markRoomAsRead.bind(roomService);
    getUserRooms = roomService.getUserRooms.bind(roomService);
    getRoomAndOpponent = roomService.getRoomAndOpponent.bind(roomService);

    canSendMessageInRoom = messageService.canSendMessageInRoom.bind(messageService);
    canAccessUpload = messageService.canAccessUpload.bind(messageService);
    getRoomHistory = messageService.getRoomHistory.bind(messageService);
    createMessage = messageService.createMessage.bind(messageService);
    getPreviousMessages = messageService.getPreviousMessages.bind(messageService);
}

export const chatService = new ChatService();
