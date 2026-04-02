# Original Prompt: Blog Migration Script (v2)
Plan: 004 | Name: blog-migration-v2 | Created: 2026-04-02 | GitRef: 985cde6

## Related Files
- **Context**: `.agent_session/004_blog-migration-v2_context.md` - Research findings
- **Plan**: `.agent_session/004_blog-migration-v2_plan.md` - Implementation steps

---

## Original User Request

> Create a script to scan the crawled website for blog posts and recreate these blog posts neatly in the new architecture. Make sure the appropriate pictures are migrated over and cleanly separate the pictures and images in the blog posts from the ones in the gallery. In the gallery I will be removing images that are not relevant for the gallery but I don't want this to disappear from the blog post if they are cross-linked

---

## Refined Prompt

Create a Node.js script to scan the crawled WordPress site (crawled-site/www.estebike.it/) and produce clean Astro-compatible blog posts in src/content/blog/ with properly migrated images.

Key requirements:
- Blog images MUST be independent copies in public/images/blog/ — never reference /images/gallery/
- Gallery images may be deleted without affecting blog posts
- Script must be idempotent with --dry-run and --force flags
- Pick best resolution from WordPress thumbnails
