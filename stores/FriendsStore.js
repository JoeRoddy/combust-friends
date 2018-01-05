import { observable, computed } from "mobx";
import friendsService from "../service/FriendsService";

//DEPENDENCIES
import usersStore from "./UsersStore";
import notificationStore from "./NotificationStore";

class FriendsStore {
  subscribeToEvents() {
    //must be inline functions, or use .bind(this)
    usersStore.onLogin(this.getFriendsForUser.bind(this));
    usersStore.onLogout(this.onUserLogout.bind(this));

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
    friendsService.listenToFriendships(userId, (err, friendshipId) => {
      friendsService.listenToFriendship(
        friendshipId,
        userId,
        (err, friendship) => {
          const usersInFriendship = friendship.users
            ? Object.keys(friendship.users)
            : [];
          const friendId = usersInFriendship.find(uid => uid !== userId);
          this.friendshipsMapByFriendId.set(friendId, friendship);
          if (friendship.status === "active") {
            this.activeFriendshipsByFriendIdMap.set(friendId, true);
            usersStore.listenToPublicUserData(friendId);
          }
        }
      );
    });

    this.usersLoaded = true;
  }

  storeFriend(friendId, friend) {
    usersStore.saveUserLocally(friendId, friend);
    this.friendIdsMap.set(friendId, true);
  }

  isFriend(userId) {
    return this.activeFriendshipsByFriendIdMap.has(userId);
  }

  getFriend(userId) {
    return this.isFriend(userId) ? usersStore.getUserById(userId) : null;
  }

  /**
   * returns 'friend', 'pending', or 'non_friend'
   * @param {*} friendId
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
    const clientUser = usersStore.user;
    const body = `${clientUser.email} would like to be your friend`;
    friendsService.sendFriendRequest(friendId, usersStore.userId, body);
  }

  @computed
  get friends() {
    let friends = {};
    Array.from(this.activeFriendshipsByFriendIdMap.keys()).forEach(uid => {
      const friend = usersStore.getUserById(uid);
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
    friendsService.answerFriendRequest(isAccepted, notification.friendshipId);
  };

  onUserLogout(user) {
    this.friendIdsMap.clear();
    this.usersLoaded = false;
  }
}

const friendsStore = new FriendsStore();
export default friendsStore;
