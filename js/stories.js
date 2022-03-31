"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  const showStar = Boolean(currentUser);

  return $(`
      <li id="${story.storyId}">
      ${getDeleteBtnHTML()}
      ${showStar ? getStarHTML(story, currentUser) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

/** Gets data from new story form and adds it to the page */

async function submitNewStory(evt) {
  evt.preventDefault();

  const title = $("#create-title").val();
  const author = $("#create-author").val();
  const url = $("#create-url").val();
  const username = currentUser.username;
  const storyData = { author, title, url, username };

  const story = await storyList.addStory(currentUser, storyData);

  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);

  $submitForm.slideUp("fast");
  $submitForm.trigger("reset");
}

$submitForm.on("submit", submitNewStory);

/** Make delete button HTML for story */

function getDeleteBtnHTML() {
  return `
  <span class="trash-can">
    <i class="fas fa-trash-alt"></i>
  </span>`;
}

/** Make favorite/not-favorite star for story */

function getStarHTML(story, user) {
  const isFavorite = user.isFavorite(story);
  const starType = isFavorite ? "fas" : "far";
  return `
      <span class="star">
        <i class="${starType} fa-star"></i>
      </span>`;
}

/** Deletes story  */
async function deleteStory(evt) {
  console.debug("deleteStory");

  const $closestLi = $(evt.target).closest("li");
  const storyId = $closestLi.attr("id");

  await storyList.removeStory(currentUser, storyId);

  // re-generate story list
  await putStoriesOnPage();
}

$body.on("click", ".trash-can", deleteStory);

/**Adds or removes a story from the users favorites list */
async function toggleFavorite(evt) {
  const $target = $(evt.target);
  const $closestLi = $target.closest("li");
  const storyId = $closestLi.attr("id");
  const story = storyList.stories.find((s) => s.storyId === storyId);

  if ($target.hasClass("fas")) {
    // currently a favorite: remove from user's fav list and change star
    await currentUser.removeFavorite(story);
    $target.closest("i").toggleClass("fas far");
  } else {
    // currently not a favorite: do the opposite
    await currentUser.addFavorite(story);
    $target.closest("i").toggleClass("fas far");
  }
}

$allStoriesList.on("click", ".star", toggleFavorite);
