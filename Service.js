import firebase from "firebase";

class FriendsService {
  addFriend(friendId, uid) {
    this.setFriendship(friendId, uid, true);
  }

  removeFriend(friendId, uid) {
    this.setFriendship(friendId, uid, false);
  }

  setFriendship(friendId, uid, isFriend) {
    firebase
      .database()
      .ref("friendsByUser/" + uid)
      .child(friendId)
      .set(isFriend ? true : null);
  }

  listenToFriends(userId, callback) {
    this.listenToFriendIds(userId, (err, friendId) => {
      this.listenToFriend(friendId, callback);
    });
  }

  listenToFriendIds(userId, callback) {
    firebase
      .database()
      .ref("friendsByUser")
      .child(userId)
      .on("child_added", snap => {
        callback(null, snap.key);
      });
  }

  // loadAndListenToFriends(friends, callback) {
  //   friends &&
  //     Object.keys(friends).forEach(friendId => {
  //       this.listenToFriend(friendId, callback);
  //     });
  // }

  listenToFriend(friendId, callback) {
    firebase
      .database()
      .ref("users/" + friendId + "/public")
      .on("value", snapshot => {
        let friend = snapshot.val();
        if (!friend) {
          callback(null, null);
        }
        friend.id = friendId;
        callback(null, friend);
      });
  }
}

const friendsService = new FriendsService();

export default friendsService;
