import { observable, computed } from "mobx";

import friendDb from "../db/FriendDb";
import userStore from "./UserStore";
import notificationStore from "./NotificationStore";

class FriendStore {
  init() {
    userStore.onLogin(this.getFriendsForUser.bind(this));
    userStore.onLogout(this.onUserLogout.bind(this));
    notificationStore.onNotificationAction(
      "friend_request",
      this.handleFriendRequestDecision.bind(this)
    );
  }

  @observable friendshipsMapByFriendId = new Map();
  @observable friendIdsMap = new Map();
  @observable activeFriendshipsByFriendIdMap = new Map();

  usersLoaded = false;
  getFriendsForUser(user) {
    if (this.usersLoaded) {
      return;
    }

    const userId = user.id;
    friendDb.listenToFriendships(userId, (err, friendshipId) => {
      friendDb.listenToFriendship(friendshipId, (err, friendship) => {
        const usersInFriendship = friendship.users
          ? Object.keys(friendship.users)
          : [];
        const friendId = usersInFriendship.find(uid => uid !== userId);
        this.friendshipsMapByFriendId.set(friendId, friendship);
        if (friendship.status === "active") {
          this.activeFriendshipsByFriendIdMap.set(friendId, true);
          userStore.getUserById(friendId); //apply listener
        }
      });
    });

    this.usersLoaded = true;
  }

  isFriend(userId) {
    return this.activeFriendshipsByFriendIdMap.has(userId);
  }

  /**
   * returns 'friend', 'pending', or 'non_friend'
   * @param {string} friendId
   */
  friendshipStatus(friendId) {
    if (this.isFriend(friendId)) {
      return "friend";
    } else if (this.friendshipsMapByFriendId.has(friendId)) {
      return "pending";
    } else {
      return "non_friend";
    }
  }

  addFriend(friendId) {
    if (this.isFriend(friendId)) {
      return console.error("users are already friends");
    } else if (this.friendshipsMapByFriendId.has(friendId)) {
      return console.error("friend request already pending");
    }
    const clientUser = userStore.user;
    const body = `${clientUser.displayName} would like to be your friend`;
    friendDb.sendFriendRequest(friendId, userStore.userId, body);
  }

  @computed
  get friends() {
    let friends = {};
    Array.from(this.activeFriendshipsByFriendIdMap.keys()).forEach(uid => {
      const friend = userStore.getUserById(uid);
      if (friend) {
        friends[uid] = friend;
      }
    });
    return friends;
  }

  onFriendClickedTriggers = [];
  onFriendClicked = func => {
    this.onFriendClickedTriggers.push(func);
  };

  handleFriendClick = friend => {
    this.onFriendClickedTriggers.length > 0
      ? this.onFriendClickedTriggers.forEach(event => {
          event(friend);
        })
      : alert(
          "Friend clicked, add the chat module or create your own handler.\n\nie: \nfriendStore.onFriendClicked(friend =>{\n\talert('do stuff'))\n}"
        );
  };

  handleFriendRequestDecision = (notification, action) => {
    let isAccepted = action === "accept";
    friendDb.answerFriendRequest(
      isAccepted,
      notification.friendshipId,
      notification.createdBy
    );
  };

  onUserLogout(user) {
    this.friendIdsMap.clear();
    this.activeFriendshipsByFriendIdMap.clear();
    this.usersLoaded = false;
  }
}

const friendStore = new FriendStore();
export default friendStore;
