import { observable, computed } from "mobx";
import friendsService from "../service/FriendsService";

//DEPENDENCIES
import usersStore from "./UsersStore";

class FriendsStore {
  subscribeToEvents() {
    //must be inline functions, or use .bind(this)
    usersStore.onLogin(this.getFriendsForUser.bind(this));
    usersStore.onLogout(this.onUserLogout.bind(this));
  }

  @observable friendIdsMap = new Map();

  usersLoaded = false;
  getFriendsForUser(user) {
    if (this.usersLoaded) {
      return;
    }
    friendsService.listenToFriends(user.id, (err, friend) => {
      err ? console.log(err) : this.storeFriend(friend.id, friend);
    });
    this.usersLoaded = true;
  }

  storeFriend(friendId, friend) {
    usersStore.saveUserLocally(friendId, friend);
    this.friendIdsMap.set(friendId, true);
  }

  isFriend(userId) {
    return this.getFriend(userId) ? true : false;
  }

  getFriend(userId) {
    return usersStore.getUserById(userId);
  }

  addFriend(userIdOfFriend) {
    friendsService.addFriend(userIdOfFriend, usersStore.userId);
  }

  @computed
  get friends() {
    let friends = {};
    Array.from(this.friendIdsMap.keys()).forEach(uid => {
      friends[uid] = usersStore.getUserById(uid);
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

    //if chat enabled -> open chat
    //else if profiles -> open profile
  };

  onUserLogout(user) {
    this.friendIdsMap.clear();
    this.usersLoaded = false;
  }
}

const friendsStore = new FriendsStore();
export default friendsStore;
