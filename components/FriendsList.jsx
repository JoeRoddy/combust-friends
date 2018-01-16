import React from "react";
import { observer } from "mobx-react";

import friendStore from "../../stores/FriendStore";
import UserList from "../users/UserList";
import chatStore from "../../stores/ChatStore";

friendStore.onFriendClicked(user => {
  chatStore.openConversationWithUser(user.id);
});

const FriendsList = observer(() => {
  return (
    <UserList
      title="Friends"
      users={friendStore.friends}
      onUserClicked={friendStore.handleFriendClick}
    />
  );
});

export default FriendsList;
