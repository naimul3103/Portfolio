import { z } from 'zod';

/**
 * Schemas for the YAML singletons in content/. These are not Astro collections —
 * they are configuration-shaped content, validated once per build. A malformed
 * singleton must fail the build, never render as `undefined`.
 */

const link = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

export const navigationSchema = z
  .object({
    entries: z
      .array(
        z.object({
          label: z.string().min(1),
          url: z.string().startsWith('/'),
          visible: z.boolean().default(true),
          order: z.number(),
          primary: z.boolean().default(false),
        }),
      )
      .min(3),
  })
  .strict();

export const siteConfigSchema = z
  .object({
    name: z.string(),
    short_name: z.string(),
    role: z.string(),
    role_line: z.string(),
    tagline: z.string(),
    location: z.string(),
    timezone: z.string(),
    email: z.string().email(),
    availability: z.enum(['open', 'busy', 'hidden']),
    availability_text: z.string(),
    socials: z
      .object({
        github: z.string().url(),
        linkedin: z.string().url(),
      })
      .strict(),
    footer: z
      .object({
        copyright: z.string(),
        signature: z.string(),
        note: z.string(),
      })
      .strict(),
    flags: z
      .object({
        search: z.boolean(),
        feed: z.boolean(),
        comments: z.enum(['on', 'per_post', 'off']),
        og_images: z.boolean(),
        now_page: z.boolean(),
        chat: z.boolean(),
      })
      .strict(),
  })
  .strict();

export const seoSchema = z
  .object({
    default: z
      .object({
        title_suffix: z.string(),
        description: z.string(),
        og_image: z.string(),
        twitter_card: z.enum(['summary', 'summary_large_image']),
      })
      .strict(),
    pages: z.record(
      z.object({
        title: z.string(),
        description: z.string(),
      }),
    ),
  })
  .strict();

export const chatbotSchema = z
  .object({
    enabled: z.boolean(),
    greeting: z.string(),
    suggested_questions: z.array(z.string()).min(3).max(6),
    rate_limit_text: z.string(),
    fallback_text: z.string(),
    disclosure: z.string(),
  })
  .strict();

export const homePageSchema = z
  .object({
    hero: z
      .object({
        eyebrow: z.string(),
        headline: z.string(),
        highlight: z.string(),
        subtext: z.string(),
        primary_cta: link,
        secondary_cta: link,
        status_note: z.string(),
        console: z
          .object({
            title: z.string(),
            command: z.string(),
            lines: z.array(z.string()).min(1),
          })
          .strict(),
      })
      .strict(),
    stats: z
      .array(
        z.object({
          value: z.string(),
          label: z.string(),
          note: z.string(),
        }),
      )
      .min(1),
    sections: z
      .array(
        z.object({
          id: z.enum(['work', 'capabilities', 'writing', 'cta']),
          visible: z.boolean(),
          order: z.number(),
          index: z.string(),
          title: z.string(),
          note: z.string().optional(),
        }),
      )
      .min(1),
    capabilities: z
      .array(
        z.object({
          title: z.string(),
          summary: z.string(),
          items: z.array(z.string()).min(1),
        }),
      )
      .min(1),
    cta: z
      .object({
        title: z.string(),
        body: z.string(),
        primary: link,
        secondary: link,
      })
      .strict(),
  })
  .strict();

export const aboutPageSchema = z
  .object({
    eyebrow: z.string(),
    title: z.string(),
    intro: z.string(),
    story: z.array(z.string()).min(1),
    quote: z.string(),
    values: z.array(z.object({ title: z.string(), body: z.string() })).min(1),
    beyond: z
      .object({
        title: z.string(),
        intro: z.string(),
        reading_title: z.string(),
        reading_note: z.string(),
        anime_title: z.string(),
        anime_note: z.string(),
        gallery_title: z.string(),
        gallery_note: z.string(),
      })
      .strict(),
    closing: z
      .object({
        title: z.string(),
        body: z.string(),
        cta: link,
      })
      .strict(),
  })
  .strict();

export const projectsPageSchema = z
  .object({
    eyebrow: z.string(),
    title: z.string(),
    intro: z.string(),
    empty: z.object({ title: z.string(), body: z.string(), action_label: z.string() }).strict(),
    filters: z
      .object({ all_label: z.string(), stack_label: z.string(), sort_label: z.string() })
      .strict(),
    labels: z
      .object({
        featured: z.string(),
        outcomes: z.string(),
        evidence: z.string(),
        differently: z.string(),
        status: z.record(z.string()),
        category: z.record(z.string()),
      })
      .strict(),
  })
  .strict();

export const blogPageSchema = z
  .object({
    eyebrow: z.string(),
    title: z.string(),
    intro: z.string(),
    empty: z.object({ title: z.string(), body: z.string(), action_label: z.string() }).strict(),
    categories: z.record(z.string()),
    labels: z
      .object({
        read_time: z.string(),
        updated: z.string(),
        ai_generated: z.string(),
        ai_disclosure: z.string(),
        related: z.string(),
        toc: z.string(),
      })
      .strict(),
  })
  .strict();

export const labPageSchema = z
  .object({
    eyebrow: z.string(),
    title: z.string(),
    intro: z.string(),
    notice: z.string(),
    demos: z
      .array(
        z.object({
          title: z.string(),
          status: z.enum(['shipped', 'in-development', 'planned']),
          description: z.string(),
          stack: z.array(z.string()),
          model: z.string(),
          data: z.string(),
          limits: z.string(),
          source: z.string(),
        }),
      )
      .min(1),
  })
  .strict();

export const galleryPageSchema = z
  .object({
    eyebrow: z.string(),
    title: z.string(),
    intro: z.string(),
    empty: z
      .object({
        title: z.string(),
        body: z.string(),
        action_label: z.string(),
        action_href: z.string(),
      })
      .strict(),
    labels: z
      .object({
        camera: z.string(),
        settings: z.string(),
        location: z.string(),
        collection: z.record(z.string()),
      })
      .strict(),
  })
  .strict();

export const contactPageSchema = z
  .object({
    eyebrow: z.string(),
    title: z.string(),
    intro: z.string(),
    channels: z
      .object({
        email_label: z.string(),
        github_label: z.string(),
        linkedin_label: z.string(),
        response_note: z.string(),
      })
      .strict(),
    subjects: z.array(z.string()).min(1),
    form: z
      .object({
        name_label: z.string(),
        email_label: z.string(),
        subject_label: z.string(),
        message_label: z.string(),
        message_hint: z.string(),
        submit_label: z.string(),
        sending_label: z.string(),
        success_title: z.string(),
        success_body: z.string(),
        error_title: z.string(),
        error_body: z.string(),
        privacy: z.string(),
      })
      .strict(),
    empty: z.object({ title: z.string(), body: z.string() }).strict(),
  })
  .strict();

export const nowPageSchema = z
  .object({
    eyebrow: z.string(),
    title: z.string(),
    intro: z.string(),
    updated: z.coerce.date(),
    focus: z.array(z.string()).min(1),
    building: z.object({ title: z.string(), items: z.array(z.string()).min(1) }).strict(),
    learning: z.object({ title: z.string(), items: z.array(z.string()).min(1) }).strict(),
    looking_for: z.object({ title: z.string(), body: z.string() }).strict(),
    contact_note: z.string(),
  })
  .strict();

export const timelineSchema = z
  .object({
    entries: z
      .array(
        z.object({
          year: z.string(),
          title: z.string(),
          org: z.string(),
          kind: z.enum(['education', 'project', 'milestone']),
          description: z.string(),
          href: z.string().optional(),
        }),
      )
      .min(1),
  })
  .strict();

export const readingListSchema = z
  .object({
    books: z.array(
      z.object({
        title: z.string(),
        author: z.string(),
        status: z.enum(['reading', 'finished', 'want-to-read']),
        rating: z.number().min(1).max(5).optional(),
        review: z.string().optional(),
        coverUrl: z.string().optional(),
        tags: z.array(z.string()).default([]),
        started: z.coerce.date().optional(),
      }),
    ),
  })
  .strict();

export const animeSchema = z
  .object({
    anime: z.array(
      z.object({
        title: z.string(),
        studio: z.string().optional(),
        year: z.number().optional(),
        status: z.enum(['watching', 'finished', 'want-to-watch']),
        rating: z.number().min(1).max(5).optional(),
        thoughts: z.string().optional(),
      }),
    ),
  })
  .strict();

export const resumeConfigSchema = z
  .object({
    active: z.enum(['standard', 'europass']),
    allow_visitor_toggle: z.boolean(),
    templates: z.record(z.object({ label: z.string(), description: z.string() })),
    europass: z
      .object({
        language: z.string(),
        photo: z.boolean(),
        birth_date: z.boolean(),
        nationality: z.string(),
      })
      .strict(),
  })
  .strict();

export type Navigation = z.infer<typeof navigationSchema>;
export type SiteConfig = z.infer<typeof siteConfigSchema>;
export type SeoConfig = z.infer<typeof seoSchema>;
export type HomePage = z.infer<typeof homePageSchema>;
export type AboutPage = z.infer<typeof aboutPageSchema>;
export type ProjectsPage = z.infer<typeof projectsPageSchema>;
export type BlogPage = z.infer<typeof blogPageSchema>;
export type LabPage = z.infer<typeof labPageSchema>;
export type GalleryPage = z.infer<typeof galleryPageSchema>;
export type ContactPage = z.infer<typeof contactPageSchema>;
export type NowPage = z.infer<typeof nowPageSchema>;
