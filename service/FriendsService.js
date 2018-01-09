import firebase from "firebase";
import notificationService from "./NotificationService";

class FriendsService {
  sendFriendRequest(friendId, uid, requestBody) {
    const friendshipId = this.createFriendship(uid, friendId);
    notificationService.createNotification(
      {
        userId: friendId,
        createdBy: uid,
        type: "friend_request",
        friendshipId: friendshipId,
        body: requestBody,
        actions: {
          accept: true,
          decline: true
        }
      },
      friendId
    );
  }

  removeFriend(friendId, uid) {
    this.setFriendship(friendId, uid, false);
  }

  answerFriendRequest(isAccepted, friendshipId) {
    if (!friendshipId) {
      return;
    }

    firebase
      .database()
      .ref("friends/friendships")
      .child(friendshipId)
      .update({
        status: isAccepted ? "active" : "declined",
        acceptedOn: isAccepted ? new Date().getTime() : null
      });
  }

  createFriendship(uid, friendId) {
    if (!uid || !friendId) {
      throw new Error(
        "createFrienship() missing arg, userId:" +
          uid +
          " -- friendId: " +
          friendId
      );
    }
    let db = firebase.database();
    const friendship = {
      createdAt: new Date().getTime(),
      users: {
        [uid]: true,
        [friendId]: true
      },
      status: "pending"
    };

    const fRef = db.ref("friends/friendships").push();
    const friendshipId = fRef.key;
    fRef.set(friendship);
    [uid, friendId].forEach(u => {
      db.ref("friends/friendshipIdsByUser/" + u + "/" + friendshipId).set(true);
    });

    return friendshipId;
  }

  listenToFriends(userId, callback) {
    this.listenToFriendships(userId, (err, friendshipId) => {
      this.listenToFriendship(friendshipId, callback);
    });
  }

  listenToFriendships(userId, callback) {
    firebase
      .database()
      .ref("friends/friendshipIdsByUser")
      .child(userId)
      .on("child_added", snap => {
        callback(null, snap.key);
      });
  }

  listenToFriendship(friendshipId, callback) {
    firebase
      .database()
      .ref("friends/friendships")
      .child(friendshipId)
      .on("value", snap => {
        let friendship = snap.val();
        if (friendship) {
          return callback(null, friendship);
        }
        return friendship
          ? callback(null, friendship)
          : callback("No friendship found w/id: " + friendshipId);
      });
  }

  listenToFriend(friendId, callback) {
    firebase
      .database()
      .ref("users/publicInfo/" + friendId)
      .on("value", snapshot => {
        let friend = snapshot.val();
        if (!friend) {
          return callback("no friend data w/ uid:" + friendId);
        }
        friend.id = friendId;
        callback(null, friend);
      });
  }
}

const friendsService = new FriendsService();

export default friendsService;
