const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const User = require('../models/userModel');
const Interest = require('../models/interestModel');
const UserInterest = require('../models/userInterestsModel');
const Club = require('../models/clubModel');
const ClubInterest = require('../models/clubInterestsModel');
const ClubMembership = require('../models/clubMembershipsModel');
const ClubEvent = require('../models/clubEventModel');
const ClubPost = require('../models/clubPostModel');

async function seed() {
  const filePath = path.join(__dirname, 'seedData.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const inserted = {
    users: 0,
    interests: 0,
    userInterests: 0,
    clubs: 0,
    clubInterests: 0,
    clubMemberships: 0,
    clubEvents: 0,
    clubPosts: 0
  };

  const usersByEmail = {};
  const interestsByName = {};
  const clubsByName = {};

  // Seed Users
  for (const user of data.users || []) {
    try {
      const existing = await User.findOne({ email: user.email });
      if (!existing) {
        const newUser = await User.create(user);
        inserted.users++;
        usersByEmail[user.email] = newUser._id;
      } else {
        usersByEmail[user.email] = existing._id;
      }
    } catch (err) {
      console.error(`Error seeding user ${user.email}: ${err.message}`);
    }
  }

  // Seed Interests
  for (const name of data.interests || []) {
    try {
      const existing = await Interest.findOne({ name });
      if (!existing) {
        const newInterest = await Interest.create({ name });
        inserted.interests++;
        interestsByName[name] = newInterest._id;
      } else {
        interestsByName[name] = existing._id;
      }
    } catch (err) {
      console.error(`Error seeding interest "${name}": ${err.message}`);
    }
  }

  // Seed UserInterests
  for (const item of data.userInterests || []) {
    try {
      const exists = await UserInterest.findOne({
        user: usersByEmail[item.userEmail],
        interest: interestsByName[item.interestName]
      });
      if (!exists) {
        await UserInterest.create({
          user: usersByEmail[item.userEmail],
          interest: interestsByName[item.interestName]
        });
        inserted.userInterests++;
      }
    } catch (err) {
      console.error(`Error linking user "${item.userEmail}" to interest "${item.interestName}": ${err.message}`);
    }
  }

  // Seed Clubs
  for (const club of data.clubs || []) {
    try {
      const existing = await Club.findOne({ name: club.name });
      if (!existing) {
        const newClub = await Club.create({
          name: club.name,
          description: club.description,
          email: club.email,
          imgUrl: club.imgUrl,
          createdBy: usersByEmail[club.createdByEmail],
          executives: club.executiveEmails.map(email => usersByEmail[email])
        });
        inserted.clubs++;
        clubsByName[club.name] = newClub._id;
      } else {
        clubsByName[club.name] = existing._id;
      }
    } catch (err) {
      console.error(`Error seeding club "${club.name}": ${err.message}`);
    }
  }

  // Seed ClubInterests
  for (const item of data.clubInterests || []) {
    try {
      const exists = await ClubInterest.findOne({
        club: clubsByName[item.clubName],
        interest: interestsByName[item.interestName]
      });
      if (!exists) {
        await ClubInterest.create({
          club: clubsByName[item.clubName],
          interest: interestsByName[item.interestName]
        });
        inserted.clubInterests++;
      }
    } catch (err) {
      console.error(`Error linking club "${item.clubName}" to interest "${item.interestName}": ${err.message}`);
    }
  }

  // Seed ClubMemberships
  for (const item of data.clubMemberships || []) {
    try {
      const exists = await ClubMembership.findOne({
        club: clubsByName[item.clubName],
        user: usersByEmail[item.userEmail]
      });
      if (!exists) {
        await ClubMembership.create({
          club: clubsByName[item.clubName],
          user: usersByEmail[item.userEmail],
          role: item.role
        });
        inserted.clubMemberships++;
      }
    } catch (err) {
      console.error(`Error linking member "${item.userEmail}" to club "${item.clubName}": ${err.message}`);
    }
  }

  // Seed ClubEvents
  for (const event of data.clubEvents || []) {
    try {
      const exists = await ClubEvent.findOne({
        title: event.title,
        club: clubsByName[event.clubName]
      });
      if (!exists) {
        await ClubEvent.create({
          title: event.title,
          description: event.description,
          date: new Date(event.date),
          location: event.location,
          club: clubsByName[event.clubName]
        });
        inserted.clubEvents++;
      }
    } catch (err) {
      console.error(`Error seeding event "${event.title}" for club "${event.clubName}": ${err.message}`);
    }
  }

  // Seed ClubPosts
  for (const post of data.clubPosts || []) {
    try {
      const exists = await ClubPost.findOne({
        title: post.title,
        club: clubsByName[post.clubName]
      });
      if (!exists) {
        await ClubPost.create({
          title: post.title,
          content: post.content,
          date: new Date(post.date),
          imgUrl: post.imgUrl,
          club: clubsByName[post.clubName]
        });
        inserted.clubPosts++;
      }
    } catch (err) {
      console.error(`Error seeding post "${post.title}" for club "${post.clubName}": ${err.message}`);
    }
  }

  // Final log summary
  console.log(`Seeding complete:
  Users added: ${inserted.users}
  Interests added: ${inserted.interests}
  UserInterests added: ${inserted.userInterests}
  Clubs added: ${inserted.clubs}
  ClubInterests added: ${inserted.clubInterests}
  ClubMemberships added: ${inserted.clubMemberships}
  ClubEvents added: ${inserted.clubEvents}
  ClubPosts added: ${inserted.clubPosts}`);
}

module.exports = seed;
