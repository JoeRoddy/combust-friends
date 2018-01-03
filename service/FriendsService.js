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

  listenToFriend(friendId, callback) {
    firebase
      .database()
      .ref("users/publicInfo/" + friendId)
      .on("value", snapshot => {
        let friend = snapshot.val();
        if (!friend) {
          debugger;
          return callback("no friend data w/ uid:" + friendId);
        }
        friend.id = friendId;
        callback(null, friend);
      });
  }
}

const friendsService = new FriendsService();

export default friendsService;
