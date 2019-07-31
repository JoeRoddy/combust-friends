import firebase from "firebase/app";
import "firebase/database";

import notificationDb from "./NotificationDb";
import userStore from "../stores/UserStore";

class FriendDb {
  sendFriendRequest(friendId, uid, requestBody) {
    const friendshipId = this.createFriendship(uid, friendId);
    _createFriendRequestNotif(friendshipId, friendId, uid, requestBody);
  }

  removeFriend(friendId, uid) {
    this.setFriendship(friendId, uid, false);
  }

  answerFriendRequest(isAccepted, friendshipId, friendId) {
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

    if (isAccepted) {
      _createRequestAcceptedNotif(friendshipId, friendId);
    }
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
}

const friendDb = new FriendDb();

export default friendDb;

const _createFriendRequestNotif = function(
  friendshipId,
  friendId,
  uid,
  requestBody
) {
  notificationDb.createNotification(
    {
      type: "friend_request",
      friendshipId,
      body: requestBody,
      link: "/profile/" + uid,
      actions: {
        accept: true,
        decline: true
      }
    },
    friendId,
    uid
  );
};

const _createRequestAcceptedNotif = function(friendshipId, friendId) {
  const { displayName, id } = userStore.user;
  notificationDb.createNotification(
    {
      type: "friend_request_accepted",
      friendshipId,
      body: displayName + " accepted your friend request!",
      link: "/profile/" + id
    },
    friendId,
    id
  );
};
