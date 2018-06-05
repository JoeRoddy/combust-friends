import React, { Fragment } from "react";
import { observer } from "mobx-react";
import { Text } from "react-native";

import nav from "../../helpers/NavigatorHelper";
import friendStore from "../../stores/FriendStore";
import { Button, Screen } from "../reusable";
import UserList from "../users/UserList";

const FriendsList = observer(() => {
  const { friends } = friendStore;
  const isFriendless = Object.keys(friends).length === 0;

  return (
    <Screen title="Friends" noPadding={!isFriendless}>
      {isFriendless ? (
        <FindFriends />
      ) : (
        <UserList
          users={friendStore.friends}
          onUserPressed={user => nav.navigate("Profile", { id: user.id })}
        />
      )}
    </Screen>
  );
});

export default FriendsList;

const FindFriends = () => (
  <Fragment>
    <Text style={{ margin: 10 }}>You have no friends</Text>
    <Button title="Find Friends" onPress={() => nav.navigate("UserSearch")} />
  </Fragment>
);
