/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ForumPost, ForumComment, ForumCategory, EducationArticle, EducationCategory } from './types';

const KEY_PREFIX = 'scca_';

// Default Educational Articles
const DEFAULT_ARTICLES: EducationArticle[] = [
  {
    id: 'art-001',
    title: 'Understanding Sickle Cell Anemia: The Core Mechanisms',
    category: 'general-disease',
    summary: 'Analyze how sickled red blood cells impact oxygen transportation and blood flow, leading to vaso-occlusive events.',
    content: `### What is Sickle Cell Disease?
Sickle Cell Disease (SCD) is an inherited group of blood disorders that affects hemoglobin—the protein in red blood cells that carries oxygen throughout the body.

Normally, red blood cells are round, flexible, and disc-shaped, allowing them to glide smoothly through tiny blood vessels. In individuals with SCD, an abnormal form of hemoglobin (Hemoglobin S) causes cells to become stiff, sticky, and curve into a crescent or **"sickle" shape** under low-oxygen conditions.

### Vaso-Occlusive Crises (VOC)
Because of their shape and rigidity, sickle cells frequently get stuck in narrow blood capillaries, blocking normal blood flow. This blockage is known as a **vaso-occlusive crisis**. It deprives surrounding tissues of oxygen, leading to:
- Severe acute pain (often in joints, chest, back, or abdomen).
- Tissue damage or localized ischemia.
- Secondary swelling and high risk of infections.

### Chronic Anemia
Healthy red blood cells live for about 120 days. Sickled red blood cells are fragile and break down (hemolyze) in just 10 to 20 days. The bone marrow cannot produce new cells fast enough to replace them, resulting in chronic anemia, fatigue, and lower athletic endurance.

### Preventive Guidelines
1. **Consistent Fluid Intake**: Prevents blood thickening and viscosity spikes.
2. **Temperature Modulation**: Extremes of cold or sudden heat can trigger vaso-constriction and sickling. Avoid sub-zero pools or heavy sweating without rehydration.
3. **Daily Supps**: Consistently intake folic acid and physician-prescribed Hydroxyurea to boost fetal hemoglobin (HbF) levels.`,
    readTime: '6 min read',
    author: 'Medical Advisory Board SCCA',
    createdAt: '2026-05-15T09:00:00.000Z'
  },
  {
    id: 'art-002',
    title: 'Nutrition & Diet Strategies for Sickle Cell Warriors',
    category: 'nutrition',
    summary: 'A complete nutrition guide highlighting specific vitamins, micronutrients, hydration schedules, and foods that boost red blood cell production.',
    content: `### High-Performance Nutrition in SCD
A healthy, nutrient-rich diet is vital for warriors to aid the rapid replenishment of red blood cells and combat oxidative stress.

### Essential Nutrients
- **Folic Acid (Vitamin B9)**: Vital for DNA synthesis and building new healthy red blood cells. Focus on leafy greens, broccoli, beans, and fortified grains.
- **Vitamin B6 & B12**: Helps support blood wellness and neurological stability. Found in fish, lean meats, poultry, and dairy.
- **Zinc**: Promotes wound healing, skeletal growth, and cellular immunity. Found in beans, nuts, and whole grains.
- **Vitamin D & Calcium**: Prevents osteopenia and bone thinning which are common complications of marrow expansion in SCD.

### Hydration: The Golden Rule
Hydration is not just a preference; it is a life-saving daily routine.
- **Target**: Minimum 3.5 Liters of water daily for adult warriors.
- **Mechanism**: Warm or room-temperature water keeps blood thin and prevents red blood cells from adhering to blood vessel walls.
- **Tip**: Drink a whole glass of water immediately upon waking, as dehydration peaks during the overnight resting phase.

### Foods to Limit
- Excess processed sugars (causes dehydration).
- Heavy caffeinated drinks, which act as diuretics and drain body fluids.
- Extremely high sodium foods, which disrupt water balance.`,
    readTime: '4 min read',
    author: 'Chief Dietitian, SCCA',
    createdAt: '2026-05-20T10:15:00.000Z'
  },
  {
    id: 'art-003',
    title: 'Managing and Preventing Pain Crises (VOCs)',
    category: 'pain-management',
    summary: 'Practical home care steps, clinical triggers, breathing rhythms, and criteria to identify when a pain crisis requires emergency hospitalization.',
    content: `### Vaso-Occlusive Pain Management
A pain crisis can strike suddenly. Having an proactive action plan saves lives and reduces the duration of the episode.

### Recognizing Triggers
Common triggers that initiate vaso-occlusion involve:
1. **Extreme Physical Exhaustion**: Heavy unpaced exercise produces lactic acid, promoting hypoxia.
2. **Dehydration**: Reduces blood volume and thickens plasma.
3. **Emotional stress or severe anxiety**: Releases catecholamines, causing vaso-constriction.
4. **Sudden Atmospheric Shock**: Cold winds or high altitudes.

### Crucial Action Steps at Home
If you observe a pain crisis starting:
- **Instant Hydration**: Drink large quantities of warm water, weak tea, or electrolyte broths.
- **Apply Warmth**: Use warm compresses or taking a warm bath. **Never apply ice/cold packs**, as cold triggers vascular sickling.
- **Breathing Cycles**: Practice deep diaphragmatic breathing. Expanding lungs maximizes oxygen saturation in the bloodstream, reversing sickling trends.
- **Prescribed Analgesia**: Take your physician-approved painkillers as scheduled.

### Clinical Danger Red Flags
Seek emergency medical attention immediately at an SCCA Hospital if you develop:
- **Chest Pain & Difficulty Breathing** (indicators of Acute Chest Syndrome, a severe emergency).
- **Persistent fever upper than 38.5°C**.
- **Severe headache, confusion, or numbness** (stroke precautions).
- **Priapism** (painful long-duration erections).
- **Extreme, intractable pain** unresponsive to maximum home oral medications.`,
    readTime: '8 min read',
    author: 'Hematology Specialist',
    createdAt: '2026-05-25T14:30:00.000Z'
  },
  {
    id: 'art-004',
    title: 'Pediatric Care Guidelines: Raising a Child with Sickle Cell',
    category: 'childcare',
    summary: 'Crucial steps for parents, tracking young children’s spleen health, temperature regulation, and schooling communication.',
    content: `### A Parent\'s Guide to Pediatric SCD
Caring for a child with sickle cell disease requires vigilance, love, and strict adherence to clinical schedules.

### Spleen Health & Infection Prevention
Children with SCD are highly vulnerable to bacterial infections, particularly from pneumococcus, due to early-onset splenic dysfunction (functional asplenia).
- **Daily Penicillin**: Give daily prophylactic penicillin precisely as prescribed by your pediatrician up to age 5.
- **Fever Alert**: A fever of **38°C (101°F)** or higher is a **medical medical emergency** for a child with sickle cell. Do not just administer paracetamol; bring them immediately to a hospital for evaluation and antibiotics.
- **Spleen Palpation**: Learn how to gently feel your child's spleen (under the left rib cage). Sudden enlargement with pale skin indicates **splenic sequestration**, which is crucial to catch instantly.

### Practical Schooling Tips
- Inform teachers and sports instructors that your child needs **unlimited access to drinking water** and frequent bathroom privileges.
- Ensure the child wears multiple warm layers during cold school days.
- Ensure they are allowed to sit out or pace physical education if they feel tired.`,
    readTime: '5 min read',
    author: 'Pediatric Consultant',
    createdAt: '2026-05-28T11:00:00.000Z'
  },
  {
    id: 'art-005',
    title: 'Pregnancy and Sickle Cell: A Safe Maternal Path',
    category: 'pregnancy',
    summary: 'Clinical considerations for expecting mothers with sickle cell genotype, including medication adjustments and fetal monitoring plans.',
    content: `### Maternal Health with Sickle Cell
Pregnancy is possible and can be highly successful with early, specialized clinical care. It is classed as high-risk, meaning you will need careful, joint monitoring by both an obstetrician and hematologist.

### Medication Refinement (Critical Point)
- **Hydroxyurea Warning**: Hydroxyurea **MUST be discontinued** at least 3 months prior to conception and during pregnancy as it is teratogenic.
- **Folic Acid Pacing**: High-dose folic acid (5mg daily) is essential to support maternal blood flow and avoid fetal neural tube complications.

### Managing Risks during Pregnancy
Pregnancy places significant strain on a warrior's organs. Potential complications to manage include:
- **Increased VOC Crisis Frequency**: The expanding uterus can put physical pressure on core blood vessels.
- **Severe Anemia**: Requires close monitoring, and occasionally scheduled safe blood transfusions to maintain hemoglobin % levels.
- **Preeclampsia**: Regular urine protein checks & blood pressure profiling.

### Delivery Success Roadmap
1. Maintain robust hydration levels during labor.
2. Stay warm in the delivery suite.
3. Ensure adequate oxygen delivery during labor.
4. Schedule close postpartum recovery monitoring (crises are common in the first 2 weeks after birth).`,
    readTime: '7 min read',
    author: 'Maternal-Fetal Medicine Expert',
    createdAt: '2026-06-01T08:00:00.000Z'
  }
];

// Default Forum Posts
const DEFAULT_POSTS: ForumPost[] = [
  {
    id: 'post-001',
    userId: 'patient-af-002',
    authorName: 'Amara Egwu',
    title: 'How do you handle sudden cold weather in Lagos?',
    content: 'Hi everyone! The sudden rain and cold ocean winds in Lagos are really triggering mild bone soreness in my elbows today. What are your best strategies for locking in body temperature while heading out to work? Do warm thermal layers work under traditional clothing?',
    category: 'patient',
    likes: ['patient-af-001', 'user-003'],
    reports: [],
    isAppropriate: true,
    createdAt: '2026-06-02T10:00:00.000Z'
  },
  {
    id: 'post-002',
    userId: 'user-003',
    authorName: 'Fatima Bello',
    title: 'Penicillin prophylaxis routines for a 3-year old',
    content: 'My child was diagnosed with genotype SS at birth. We are keeping up with the twice-daily oral Penicillin medicine, but she is starting to refuse the taste. Has anyone successfully mixed it with applesauce or juice, or did your doctor prescribe a different format? Need parental advice.',
    category: 'caregiver',
    likes: ['patient-af-001'],
    reports: [],
    isAppropriate: true,
    createdAt: '2026-06-02T16:45:00.000Z'
  },
  {
    id: 'post-003',
    userId: 'user-spammer',
    authorName: 'Dodgy Advertiser',
    title: 'EXCLUSIVE: Miraculous herbal cure that permanently modifies hemoglobin genotype from SS to AA!',
    content: 'Buy this magical supplement from my web link right now to cure your sickle cell anemia instantly. No blood tests needed, 100% cure guaranteed, skip your hydroyuxera pills!',
    category: 'patient',
    likes: [],
    reports: ['patient-af-001'], // Pre-report this inappropriate spam post
    isAppropriate: false, // We flag it so admins can see it in moderation panel
    createdAt: '2026-06-03T01:10:00.000Z'
  }
];

// Default Forum Comments
const DEFAULT_COMMENTS: ForumComment[] = [
  {
    id: 'com-001',
    postId: 'post-001',
    userId: 'patient-af-001',
    authorName: 'Kofi Mensah',
    content: 'Absolutely! I highly recommend wearing lightweight athletic compression wear (like polyester undergarments) underneath your clothing. They trap warmth while being fully breathable. Also, carry a thermal bottle with hot water; drinking warm liquid every hour keeps your microcirculation dilated and active.',
    reports: [],
    isAppropriate: true,
    createdAt: '2026-06-02T11:15:00.000Z'
  },
  {
    id: 'com-002',
    postId: 'post-001',
    userId: 'user-003',
    authorName: 'Fatima Bello',
    content: 'Wearing thick woolen socks pays off immensely. If my feet get cold, a vaso-occlusive crisis almost always attempts to trigger in my shins. Warm baths each morning help prepare my muscles too!',
    reports: [],
    isAppropriate: true,
    createdAt: '2026-06-02T13:40:00.000Z'
  },
  {
    id: 'com-003',
    postId: 'post-002',
    userId: 'patient-af-001',
    authorName: 'Kofi Mensah',
    content: 'Hey Fatima, we had a similar issue. Our primary hematologist switched us to a sugar-free cherry flavored suspension, which made a huge difference. definitely check with your physician first before blending medications into fruit juices, as some raw acids might reduce tablet absorption parameters.',
    reports: [],
    isAppropriate: true,
    createdAt: '2026-06-02T18:20:00.000Z'
  }
];

function loadData<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(`Error loading key ${key}`, e);
  }
  return defaultValue;
}

function saveData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving key ${key}`, e);
  }
}

// Initial seed
if (!localStorage.getItem(KEY_PREFIX + 'community_initialized')) {
  saveData('articles', DEFAULT_ARTICLES);
  saveData('posts', DEFAULT_POSTS);
  saveData('comments', DEFAULT_COMMENTS);
  localStorage.setItem(KEY_PREFIX + 'community_initialized', 'true');
}

export const communityService = {
  // ==========================================
  // DISCUSSIONS & FORUMS
  // ==========================================
  getPosts: async (category?: ForumCategory): Promise<ForumPost[]> => {
    const posts = loadData<ForumPost[]>('posts', []);
    // Only return posts that are appropriate (or return all, we filter reported/deleted posts for non-admins)
    let filtered = posts.filter(p => p.isAppropriate);
    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }
    
    // Attach comment counts
    const comments = loadData<ForumComment[]>('comments', []);
    return filtered.map(post => ({
      ...post,
      commentCount: comments.filter(c => c.postId === post.id && c.isAppropriate).length
    })).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getAllPostsIncludingFlagged: async (): Promise<ForumPost[]> => {
    return loadData<ForumPost[]>('posts', []).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createPost: async (userId: string, authorName: string, title: string, content: string, category: ForumCategory): Promise<ForumPost> => {
    const posts = loadData<ForumPost[]>('posts', []);
    const newPost: ForumPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      authorName,
      title: title.trim(),
      content: content.trim(),
      category,
      likes: [],
      reports: [],
      isAppropriate: true,
      createdAt: new Date().toISOString()
    };
    posts.push(newPost);
    saveData('posts', posts);
    return newPost;
  },

  likePost: async (postId: string, userId: string): Promise<ForumPost | null> => {
    const posts = loadData<ForumPost[]>('posts', []);
    const idx = posts.findIndex(p => p.id === postId);
    if (idx !== -1) {
      const post = posts[idx];
      if (post.likes.includes(userId)) {
        // Unlike
        post.likes = post.likes.filter(id => id !== userId);
      } else {
        // Like
        post.likes.push(userId);
      }
      posts[idx] = post;
      saveData('posts', posts);
      return post;
    }
    return null;
  },

  reportPost: async (postId: string, userId: string): Promise<ForumPost | null> => {
    const posts = loadData<ForumPost[]>('posts', []);
    const idx = posts.findIndex(p => p.id === postId);
    if (idx !== -1) {
      const post = posts[idx];
      if (!post.reports.includes(userId)) {
        post.reports.push(userId);
        // Soft flag: if many report, we can toggle flag, or just keep it active for admin
        if (post.reports.length >= 3) {
          post.isAppropriate = false;
        }
      }
      posts[idx] = post;
      saveData('posts', posts);
      return post;
    }
    return null;
  },

  // ==========================================
  // COMMENTS
  // ==========================================
  getComments: async (postId: string): Promise<ForumComment[]> => {
    const comments = loadData<ForumComment[]>('comments', []);
    return comments
      .filter(c => c.postId === postId && c.isAppropriate)
      .sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  getCommentsIncludingFlagged: async (): Promise<ForumComment[]> => {
    return loadData<ForumComment[]>('comments', []);
  },

  addComment: async (postId: string, userId: string, authorName: string, content: string): Promise<ForumComment> => {
    const comments = loadData<ForumComment[]>('comments', []);
    const newComment: ForumComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      postId,
      userId,
      authorName,
      content: content.trim(),
      reports: [],
      isAppropriate: true,
      createdAt: new Date().toISOString()
    };
    comments.push(newComment);
    saveData('comments', comments);
    return newComment;
  },

  reportComment: async (commentId: string, userId: string): Promise<ForumComment | null> => {
    const comments = loadData<ForumComment[]>('comments', []);
    const idx = comments.findIndex(c => c.id === commentId);
    if (idx !== -1) {
      const comment = comments[idx];
      if (!comment.reports.includes(userId)) {
        comment.reports.push(userId);
        if (comment.reports.length >= 3) {
          comment.isAppropriate = false;
        }
      }
      comments[idx] = comment;
      saveData('comments', comments);
      return comment;
    }
    return null;
  },

  // ==========================================
  // EDUCATION CENTER
  // ==========================================
  getArticles: async (category?: EducationCategory): Promise<EducationArticle[]> => {
    const articles = loadData<EducationArticle[]>('articles', []);
    if (category) {
      return articles.filter(a => a.category === category).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return articles.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  saveArticle: async (article: Omit<EducationArticle, 'id' | 'createdAt'>, existingId?: string): Promise<EducationArticle> => {
    const articles = loadData<EducationArticle[]>('articles', []);
    const id = existingId || `art-${Date.now()}`;
    const item: EducationArticle = {
      id,
      ...article,
      createdAt: existingId ? (articles.find(a => a.id === existingId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };

    if (existingId) {
      const idx = articles.findIndex(a => a.id === existingId);
      if (idx !== -1) {
        articles[idx] = item;
      }
    } else {
      articles.push(item);
    }
    saveData('articles', articles);
    return item;
  },

  deleteArticle: async (id: string): Promise<void> => {
    const articles = loadData<EducationArticle[]>('articles', []);
    saveData('articles', articles.filter(a => a.id !== id));
  },

  // ==========================================
  // AI CHAT HISTORY COMPILATION
  // ==========================================
  getChatSessions: (userId: string): any[] => {
    const sessions = loadData<any[]>('chats', []);
    return sessions.filter(s => s.userId === userId);
  },

  saveChatSession: (userId: string, chat: any): void => {
    const sessions = loadData<any[]>('chats', []);
    const idx = sessions.findIndex(s => s.id === chat.id);
    if (idx !== -1) {
      sessions[idx] = { ...chat, userId };
    } else {
      sessions.push({ ...chat, userId });
    }
    saveData('chats', sessions);
  },

  // ==========================================
  // MODERATION OPERATIONS
  // ==========================================
  approvePost: async (postId: string): Promise<void> => {
    const posts = loadData<ForumPost[]>('posts', []);
    const idx = posts.findIndex(p => p.id === postId);
    if (idx !== -1) {
      posts[idx].reports = [];
      posts[idx].isAppropriate = true;
      saveData('posts', posts);
    }
  },

  deletePostModerator: async (postId: string): Promise<void> => {
    const posts = loadData<ForumPost[]>('posts', []);
    saveData('posts', posts.filter(p => p.id !== postId));

    // Also remove comments
    const comments = loadData<ForumComment[]>('comments', []);
    saveData('comments', comments.filter(c => c.postId !== postId));
  },

  approveComment: async (commentId: string): Promise<void> => {
    const comments = loadData<ForumComment[]>('comments', []);
    const idx = comments.findIndex(c => c.id === commentId);
    if (idx !== -1) {
      comments[idx].reports = [];
      comments[idx].isAppropriate = true;
      saveData('comments', comments);
    }
  },

  deleteCommentModerator: async (commentId: string): Promise<void> => {
    const comments = loadData<ForumComment[]>('comments', []);
    saveData('comments', comments.filter(c => c.id !== commentId));
  },

  // ==========================================
  // USER ADMINISTRATION
  // ==========================================
  getSandboxUsers: (): any[] => {
    // Collect both profiles and auth users to display Admin Dashboard list
    const users = loadData<any[]>('users', []);
    const profiles = loadData<any[]>('profiles', []);

    return users.map(user => {
      const prof = profiles.find(p => p.id === user.id) || {};
      return {
        id: user.id,
        email: user.email,
        fullName: prof.fullName || 'Warrior User',
        country: prof.country || 'Not Set',
        genotype: prof.genotype || 'Unknown',
        role: user.id === 'patient-af-001' ? 'admin' : 'warrior'
      };
    });
  },

  deleteUser: (userId: string): void => {
    const users = loadData<any[]>('users', []);
    saveData('users', users.filter(u => u.id !== userId));

    const profiles = loadData<any[]>('profiles', []);
    saveData('profiles', profiles.filter(p => p.id !== userId));
  }
};
