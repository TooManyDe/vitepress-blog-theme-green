import path from "node:path";
import { writeFileSync } from "node:fs";
import { Feed } from "feed";
import { createContentLoader, type SiteConfig } from "vitepress";

const hostname = "https://ddbx.org";

export async function createRssFileZH(config: SiteConfig) {
  const feed = new Feed({
    title: '的的不休',
    description: '每一段旅行都有终点',
    id: hostname,
    link: hostname,
    language: "zh-Hans",
    image: "https://cdn.ddbx.org/02.png",
    favicon: `https://cdn.ddbx.org/13.ico`,
    copyright: "Copyright© 2021-present 的的不休",
  });

  const posts = await createContentLoader("posts/**/*.md", {
    excerpt: true,
    render: true,
  }).load();

  posts.sort((a, b) => Number(+new Date(b.frontmatter.date) - +new Date(a.frontmatter.date)));

  for (const { url, excerpt, html, frontmatter } of posts) {
    if (feed.items.length >= 5) {
      break;
    }

    const date = new Date(frontmatter.date);
    if (isNaN(date.getTime())) continue; 

    feed.addItem({
      title: frontmatter.title,
      id: `${hostname}${url}`,
      link: `${hostname}${url}`,
      description: excerpt,
      content: html,
      author: [
        {
          name: "的的不休",
          link: "https://ddbx.org/",
        },
      ],
      date, 
    });
  }

  writeFileSync(path.join(config.outDir, "feed.xml"), feed.rss2(), "utf-8");
}

export async function createRssFileEN(config: SiteConfig) {
  const feed = new Feed({
    title: "的的不休",
    description: "Every trip has an end",
    id: hostname,
    link: hostname,
    language: "en-US",
    image: "https://cdn.ddbx.org/02.png",
    favicon: `https://cdn.ddbx.org/13.ico`,
    copyright: "Copyright© 2021-present 的的不休",
  });

  const posts = await createContentLoader("en/posts/**/*.md", {
    excerpt: true,
    render: true,
  }).load();

  posts.sort((a, b) => Number(+new Date(b.frontmatter.date) - +new Date(a.frontmatter.date)));

  for (const { url, excerpt, html, frontmatter } of posts) {
    if (feed.items.length >= 5) {
      break;
    }

    const date = new Date(frontmatter.date);
    if (isNaN(date.getTime())) continue;

    feed.addItem({
      title: frontmatter.title,
      id: `${hostname}${url}`,
      link: `${hostname}${url}`,
      description: excerpt,
      content: html,
      author: [
        {
          name: "的的不休",
          link: "https://ddbx.org/",
        },
      ],
      date,
    });
  }

  writeFileSync(path.join(config.outDir, "feed-en.xml"), feed.rss2(), "utf-8");
}
