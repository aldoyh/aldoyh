const core = require("@actions/core");
const axios = require("axios");
const Humanize = require("humanize-plus");
const fs = require("fs");
const exec = require("./exec");

const TODOIST_API_KEY = core.getInput("TODOIST_API_KEY") || process.env.TODOIST_API_KEY;
const PREMIUM = core.getInput("PREMIUM");

async function main() {
  // v8 => v9
  const stats = await axios(
    "https://api.todoist.com/sync/v9/completed/get_stats",
    { headers: { Authorization: `Bearer ${TODOIST_API_KEY}` } }
  );
  await updateReadme(stats.data);
}

let todoist = [];
let jobFailFlag = false;
const README_FILE_PATH = "./README.md";

async function updateReadme(data) {
  const { karma, completed_count, days_items, goals, week_items } = data;

  const karmaPoint = [`🏆  **${Humanize.intComma(karma)}** Karma Points`];
  todoist.push(karmaPoint);

  const dailyGoal = [
    `🌸  Completed **${days_items[0].total_completed.toString()}** tasks today`,
  ];
  todoist.push(dailyGoal);

  if (PREMIUM == "true") {
    const weekItems = [
      `🗓  Completed **${week_items[0].total_completed.toString()}** tasks this week`,
    ];
    todoist.push(weekItems);
  }

  const totalTasks = [
    `✅  Completed **${Humanize.intComma(completed_count)}** tasks so far`,
  ];
  todoist.push(totalTasks);

  const longestStreak = [
    `⏳  Longest streak is **${goals.max_daily_streak.count}** days`,
  ];
  // todoist.push(longestStreak);

  // const currentStreak = [
  //   `🔥  Current streak is **${goals.current_streak.count}** days`,
  // ];
  // todoist.push(currentStreak);

  /**
   * 
   * 
   * 
   * Done with composition of todoist array
   */

  if (todoist.length == 0) return;

  if (todoist.length > 0) {
    // console.log(todoist.length);
    // const showTasks = todoist.reduce((todo, cur, index) => {
    //   return todo + `\n${cur}        ` + (((index + 1) === todoist.length) ? '\n' : '');
    // })
    const readmeData = fs.readFileSync(README_FILE_PATH, "utf8");

    const newReadme = buildReadme(readmeData, todoist.join("           \n"));
    if (newReadme !== readmeData) {
      core.info("✏️ Writing to " + README_FILE_PATH);
      fs.writeFileSync(README_FILE_PATH, newReadme);

      // if (!process.env.TEST_MODE) {
      //   commitReadme();
      // }

      core.info("README.md updated 👔 Successfully");

      // if (!process.env.TEST_MODE) {
      //   await exec("git", ["add", README_FILE_PATH]);
      //   await exec("git", [
      //     "commit",
      //     "-m",
      //     "📝 update README.md",
      //     "--no-verify",
      //   ]);

      //   await exec("git", ["push"]);
      // }


      process.exit(0);


      // GitHub Action git push 

    } else {
      core.info("No change detected, skipping");
      process.exit(0);
    }
  } else {
    core.info("Nothing fetched");
    process.exit(jobFailFlag ? 1 : 0);
  }
}

console.log(todoist.length);

const buildReadme = (prevReadmeContent, newReadmeContent) => {
  const tagToLookFor = "<!-- TODO-IST:";
  const closingTag = "-->";
  const startOfOpeningTagIndex = prevReadmeContent.indexOf(
    `${tagToLookFor}START`
  );
  const endOfOpeningTagIndex = prevReadmeContent.indexOf(
    closingTag,
    startOfOpeningTagIndex
  );
  const startOfClosingTagIndex = prevReadmeContent.indexOf(
    `${tagToLookFor}END`,
    endOfOpeningTagIndex
  );
  if (
    startOfOpeningTagIndex === -1 ||
    endOfOpeningTagIndex === -1 ||
    startOfClosingTagIndex === -1
  ) {
    core.error(
      `Cannot find the comment tag on the readme:\n<!-- ${tagToLookFor}:START -->\n<!-- ${tagToLookFor}:END -->`
    );
    process.exit(1);
  }
  return [
    prevReadmeContent.slice(0, endOfOpeningTagIndex + closingTag.length),
    "\n",
    newReadmeContent,
    "\n",
    prevReadmeContent.slice(startOfClosingTagIndex),
  ].join("");
};

(async () => {
  await main();
})();