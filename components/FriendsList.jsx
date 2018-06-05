import React from "react";
import { observer } from "mobx-react";

import friendStore from "../../stores/FriendStore";
import userStore from "../../stores/UserStore";
import UserList from "../users/UserList";

const FriendsList = observer(({ history }) => {
  return (
    <UserList
      title="Friends"
      users={friendStore.friends}
      onUserClicked={user => history.push("/profile/" + user.id)}
    />
  );
});

export default FriendsList;
