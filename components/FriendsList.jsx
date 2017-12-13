import React from "react";
import { observer } from "mobx-react";

import friendsStore from "../../../stores/FriendsStore";
//FRIENDS_DEPENDENCIES
import UserList from "../users/UserList";
import chatStore from "../../../stores/ChatStore";

friendsStore.onFriendClicked(user => {
  chatStore.openConversationWithUser(user.id);
});

const FriendsList = observer(() => {
  return (
    <UserList
      title="Friends"
      users={friendsStore.friends}
      onUserClicked={friendsStore.handleFriendClick}
    />
  );
});

export default FriendsList;
