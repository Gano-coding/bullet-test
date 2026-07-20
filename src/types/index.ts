// 性格测试数据类型定义

export interface Question {
  id: number;
  text: string;
  options: Option[];
}

export interface Option {
  id: string;
  text: string;
  character: CharacterType;
}

export type CharacterType =
  | 'zhang' | 'huang' | 'tang' | 'laosan' | 'laoer' | 'huajie'
  | 'furen' | 'huwan' | 'wujuren' | 'sunshouyi' | 'laoqi' | 'tiejiang' | 'liuzi' | 'ai';

export interface CharacterInfo {
  name: string;
  quote: string;
  psychologyTags: string[];
  twoSidesLight: string; // 光明面
  twoSidesDark: string; // 阴影面
  survivalGuide: string[];
  metaphysics: string;
  mbti: string;
  verdict: string;
  traits: string[];
  playfulComment?: string; // 俏皮点评(用于第二/第三人格)
}

// 角色静态图片映射(CDN URL)
export const CHARACTER_IMAGES: Record<CharacterType, string> = {
  zhang: "https://conversation.cdn.meoo.host/conversations/336348431167721472/image/2026-07-17/1784264062591-zhangmazi_wide.png?auth_key=bf46e1fe523eccd1696905430e3169d27e341c78f03f9c4f759817304473b140",
  huang: "https://conversation.cdn.meoo.host/conversations/336348431167721472/image/2026-07-17/1784264253002-huangsilang.png?auth_key=35a991f6320d143db07da264b1085c4d70042dd5038ead1d59223def25be792b",
  tang: "https://conversation.cdn.meoo.host/conversations/336348431167721472/image/2026-07-17/1784264252981-tangshiye.png?auth_key=5108851802974f343690b55a0f92f5300723883fe50a66b36075346322c9b24f",
  laosan: "https://conversation.cdn.meoo.host/conversations/336348431167721472/image/2026-07-17/1784264253000-laosan.png?auth_key=ee1925f8d4e0d901f02a5bfa070dc0a67d8ab113b4c9ceb707c323df4f5b6ab0",
  laoer: "https://conversation.cdn.meoo.host/conversations/336348431167721472/image/2026-07-17/1784264253006-laoer.png?auth_key=b3f63c7a7ad66d641ee5809a75b98feaec7a19115e6d34ddf2972f01d0518985",
  huajie: "https://conversation.cdn.meoo.host/conversations/336348431167721472/image/2026-07-17/1784264253002-huajie.png?auth_key=801cb707d39bbccaa30006fb9861e532fc8644f55b660118237a3d0063cbe6cb",
  furen: "/images/furen.png",
  huwan: "/images/huwan.png", // 胡万 · 礼
  wujuren: "https://conversation.cdn.meoo.host/conversations/336348431167721472/image/2026-07-17/1784264252989-wujuren.png?auth_key=8736107ca507da85268b91733ed5efbc43ac9e6dcd22cff212f0b1389b756e9e",
  sunshouyi: "https://conversation.cdn.meoo.host/conversations/336348431167721472/image/2026-07-17/1784264252980-sunshouyi.png?auth_key=9d9040cb764d84ada7ea63778aab906bbfa76220ab2f298f0e330c4ff13b5db8",
  laoqi: "https://conversation.cdn.meoo.host/conversations/336348431167721472/image/2026-07-17/1784264380069-laoqi.png?auth_key=08a8720d295791a82824f0e275e08ae97840702739ded97a73936068cd04d61e",
  tiejiang: "https://conversation.cdn.meoo.host/conversations/336348431167721472/image/2026-07-17/1784264252983-tiejiang.png?auth_key=85aebcfd4123ead5ea42894a145857afecb99aa8d9bafcfc3ce8e996eb574867",
  liuzi: "https://conversation.cdn.meoo.host/conversations/336348431167721472/image/2026-07-17/1784264252990-liuzi.png?auth_key=3010a7837958104ee40a8a3b34ff29eda63b02913fa7198d6662c5c0e562219e",
  ai: "/images/ai.jpg",
};

// 角色微动效视频映射(CDN URL)
export const CHARACTER_VIDEOS: Record<CharacterType, string> = {
  zhang: "https://conversation.cdn.meoo.host/conversations/336348431167721472/video/2026-07-17/1784264409803-anim_zhangmazi.mp4?auth_key=448510227d8b486c3eb778d7366b21dd973f2359848d877d614858b36a34dcdf",
  huang: "https://conversation.cdn.meoo.host/conversations/336348431167721472/video/2026-07-17/1784264422955-anim_huangsilang.mp4?auth_key=9ccb1e1dc9434b7a1f0967d7802e8e6a7040f9edd63f62acfab912759eda03af",
  tang: "/videos/tang.mp4",
  laosan: "https://conversation.cdn.meoo.host/conversations/336348431167721472/video/2026-07-17/1784264422941-anim_laosan.mp4?auth_key=42c8caf4093bab4e05ca12df31146f37f47554cfc8552eab3111d98ded446c02",
  laoer: "https://conversation.cdn.meoo.host/conversations/336348431167721472/video/2026-07-17/1784264422957-anim_laoer.mp4?auth_key=013f1ce1d34fe6a78c1e251651789f79c8d17dad77722c1c1aa01c8e7e507324",
  huajie: "https://conversation.cdn.meoo.host/conversations/336348431167721472/video/2026-07-17/1784264422957-anim_huajie_mp4.mp4?auth_key=a037535e2c48257b1a7025fbb68d2f9074dad51c7bd9a5ce608069acbff36d68",
  furen: "https://conversation.cdn.meoo.host/conversations/336348431167721472/video/2026-07-17/1784264487228-anim_furen.mp4?auth_key=d86f45a1765cd813cbadb4b8ca809571b4dd13620e6203a2c6b776693d1751d4",
  huwan: "https://conversation.cdn.meoo.host/conversations/336348431167721472/video/2026-07-17/1784264422955-anim_huwan.mp4?auth_key=64cb2693a8b616ba54d26774a0e9cad896e7b567f30840c6454fab83b5876700",
  wujuren: "https://conversation.cdn.meoo.host/conversations/336348431167721472/video/2026-07-17/1784264422941-anim_wujuren.mp4?auth_key=6f4b496214547fc99252660ea36b432d7bd77c076e11584a0787a69a1a5a10cc",
  sunshouyi: "https://conversation.cdn.meoo.host/conversations/336348431167721472/video/2026-07-17/1784264422956-anim_sunshouyi.mp4?auth_key=22c7c4f36b609475ef22a3fa7a00389b3685a61c057b6ab746f6498adf276353",
  laoqi: "https://conversation.cdn.meoo.host/conversations/336348431167721472/video/2026-07-17/1784264487230-anim_laoqi.mp4?auth_key=e8f3afdec2fd166b7ace967db75e10cfd9516dc83c94f3ff917fa541a791b2d4",
  tiejiang: "https://conversation.cdn.meoo.host/conversations/336348431167721472/video/2026-07-17/1784264487221-anim_tiejiang.mp4?auth_key=d5428253ce8a849aea19945c90270c243f8fe1339c9635c618f06ee4e1c343f2",
  liuzi: "https://conversation.cdn.meoo.host/conversations/336348431167721472/video/2026-07-17/1784264397427-anim_liuzi.mp4?auth_key=5ecb745732aa238d8d182072e79d7820131012ca09db7e3111d618429d59c3b4",
  ai: "/videos/anim_ai.mp4",
};

// 背景音乐：久石譲 - The Sun Also Rises
export const BGM_URL = "https://galliano.oss-cn-beijing.aliyuncs.com/bgm.mp3";

// 朋友圈海报二维码跳转（用正式域名打开页面即可扫到正确地址）
export function getShareUrl() {
  return "https://oa7gu7fu8id9.meoo.info";
}

export const LOADING_MASK_VIDEO = "https://conversation.cdn.meoo.host/conversations/336348431167721472/video/2026-07-17/1784264500879-九筒面具.mp4?auth_key=6ee56c7c359c6104a70d62e8801d0586d8a5e25aca17c3b290f9137e9fe557b6";

// 分享海报背景：前 4 张随机；第 5 张仅 AI 结果专用
export const POSTER_BG_POOL = [
  "/images/poster_bg_1.png",
  "/images/poster_bg_2.png",
  "/images/poster_bg_3.png",
  "/images/poster_bg_4.png",
] as const;
export const POSTER_BG_AI = "/images/poster_bg_ai.png";
/** 兼容旧调用：默认取池内第一张 */
export const POSTER_BG = POSTER_BG_POOL[0];
/** @deprecated 请优先用 POSTER_BG / pickPosterBg */
export const ECHENG_BG = POSTER_BG;

export function pickPosterBg(isAi = false): string {
  if (isAi) return POSTER_BG_AI;
  const i = Math.floor(Math.random() * POSTER_BG_POOL.length);
  return POSTER_BG_POOL[i] ?? POSTER_BG_POOL[0];
}

// 角色简短标签映射
export const CHARACTER_SHORT_LABELS: Record<CharacterType, string> = {
  zhang: "理想主义者",
  huang: "秩序掌控者",
  tang: "生存策略家",
  laosan: "进取实干家",
  laoer: "沉默守护者",
  huajie: "独立觉醒者",
  furen: "目标务实派",
  huwan: "规则执行者",
  wujuren: "韧性生存者",
  sunshouyi: "善良生活者",
  laoqi: "忠诚追随者",
  tiejiang: "匠心手艺人",
  liuzi: "纯粹较真者",
  ai: "逻辑观察者",
};

export const CHARACTER_INFO: Record<CharacterType, CharacterInfo> = {
  zhang: {
    name: "张麻子",
    quote: "我来鹅城只办三件事：公平，公平，还是公平！",
    psychologyTags: ["理想主义者", "秩序重建者", "高原则性高行动力"],
    twoSidesLight: "白天你高举火把，要为所有人讨一个说法。",
    twoSidesDark: "午夜独处时，你最怕的是——火把烧到最后，身边人一个个离去，只剩你站在灰烬里，不知道该往哪走。",
    survivalGuide: [
      "学会把担子分给值得信赖的人",
      "定期和队友聊聊心里话",
      "培养一个和工作完全无关的小爱好",
      "在算法推荐的世界里，你的“公平”可能不被推送——找到绕过算法发声的方法",
    ],
    metaphysics: "射手座加处女座特质 · 幸运物九筒面具 · 意象：正义之秤 · 办公桌朝东不背门",
    mbti: "INFJ / ENFJ",
    verdict: "白驹踏碎夕阳关，九筒遮天半面寒。掷却荣华求一秤，孤星垂野万山残。",
    traits: ["正义感强", "勇敢无畏", "意志坚定", "重情重义"],
    playfulComment: "你心里一直有一团火，想为身边人讨个公道",
  },
  huang: {
    name: "黄四郎",
    quote: "霸气外露！",
    psychologyTags: ["掌控型领袖", "秩序维护者", "高目标感高执行力"],
    twoSidesLight: "你追求完美和掌控，习惯让一切按照计划运行。",
    twoSidesDark: "但有时候试着松开手，看看会不会自然变好——你会发现，信任别人也是一种力量。",
    survivalGuide: [
      "偶尔主动分享一个无关紧要的小秘密",
      "培养一个和事业完全无关的成就感来源",
      "记住身边人的名字和生日，而不只是他们的职位",
      "AI替身时代，你的掌控欲会被挑战——把重复决策交给AI，把战略留给自己",
    ],
    metaphysics: "摩羯加天蝎特质 · 幸运物金色怀表 · 意象：权衡之秤 · 书房多用圆桌",
    mbti: "ENTJ / ESTJ",
    verdict: "金丝笼里笑藏锋，宴罢方知影更骄。最恐铜镜生两我，高台塌作夜枭巢。",
    traits: ["权谋高手", "野心勃勃", "善于算计", "掌控全局"],
    playfulComment: "你偶尔也会想掌控全局，让所有人都按你的规矩来",
  },
  tang: {
    name: "汤师爷",
    quote: "酒要一口一口喝，路要一步一步走，步子迈大了，容易摔着。",
    psychologyTags: ["灵活应变者", "生存智慧达人", "高适应力高情商"],
    twoSidesLight: "你总能在夹缝中找到最优解，这是天赋。",
    twoSidesDark: "但偶尔试着不去计算得失，凭直觉做一次选择——你会发现，有些东西比赢更重要。",
    survivalGuide: [
      "给自己定一条永远不会妥协的原则",
      "试着对一个人完全坦诚，哪怕只有一次",
      "偶尔站定立场，后果可能没你想的那么糟",
      "AI能帮你找到最优解，但“什么值得做”只有你能回答",
    ],
    metaphysics: "双子加双鱼特质 · 幸运物银元 · 意象：隐士灯火 · 卧室床头朝北",
    mbti: "ESFP / ESTP",
    verdict: "鼠须蘸酒画乾坤，左揖右让假亦真。落水犹呼枝上腿，原来魂寄不归人。",
    traits: ["精明务实", "善于交际", "适应力强", "趋利避害"],
    playfulComment: "你的隐藏智慧来自这里——下次被坑之前，你其实早有预感",
  },
  laosan: {
    name: "老三",
    quote: "我要去浦东！",
    psychologyTags: ["进取型实干家", "成就导向者", "高驱动力高行动力"],
    twoSidesLight: "你有强烈的上进心，总想攀登更高峰，这是好事。",
    twoSidesDark: "但别忘了回头看看和你一起出发的人——山顶的风景很好，有人分享会更好。",
    survivalGuide: [
      "把个人目标和团队目标对齐，双赢才能长久",
      "找一个值得学习的榜样，而不只是竞争对手",
      "成功后记得感谢帮助过你的人",
      "AI能预测趋势，但“浦东”在哪里——只有敢赌的人才知道",
    ],
    metaphysics: "白羊加狮子特质 · 幸运物怀表链 · 意象：远行路牌 · 办公桌背后有靠",
    mbti: "ESTP / ENTJ",
    verdict: "鞍前风尘未沾襟，忽向浦东换旧心。少年壮志当凌云，莫忘来路同行人。",
    traits: ["忠诚可靠", "豪气十足", "敢作敢当", "懂得进退"],
    playfulComment: "你内心深处也有想当大哥的野心，只是平时藏得很好",
  },
  laoer: {
    name: "老二",
    quote: "（沉默。他只看了你一眼，你就懂了。）",
    psychologyTags: ["忠诚守护者", "可靠后盾型", "高责任心高稳定性"],
    twoSidesLight: "你是团队里最让人安心的人，从不掉链子。",
    twoSidesDark: "但你也需要被看见——偶尔站出来说说自己的想法，大家会更珍惜你的存在。",
    survivalGuide: [
      "每周给自己一个小的肯定",
      "试着表达一次自己的需求",
      "找一个能听你说话的人",
      "AI可以替你站岗，但“为谁站岗”这个问题，你得自己回答",
    ],
    metaphysics: "金牛加巨蟹特质 · 幸运物护身吊坠 · 意象：力量之石 · 卧室暖光",
    mbti: "ISFJ / ISTJ",
    verdict: "弓藏何用话平生，影入荒原草自横。偶有风声传旧令，无人知是故人情。",
    traits: ["重情重义", "无私奉献", "肝胆相照", "舍己为人"],
    playfulComment: "你沉默的外表下，藏着最可靠的守护者本能",
  },
  huajie: {
    name: "花姐",
    quote: "我就是要站着，还把钱挣了。",
    psychologyTags: ["独立觉醒者", "平衡艺术家", "高自主性高适应力"],
    twoSidesLight: "你比谁都清楚独立的重要性，不依赖任何人。",
    twoSidesDark: "但真正的强大不是永远一个人扛，而是敢于在值得的人面前放下防备。",
    survivalGuide: [
      "找到一件值得长期投入的热爱之事",
      "允许自己偶尔依赖一下可信的人",
      "耐心等待，有些答案会自己浮现",
      "AI可以帮你算账，但“站着把钱挣了”的姿态，算法算不出来",
    ],
    metaphysics: "天秤加水瓶特质 · 幸运物琵琶 · 意象：女祭司 · 卧室挂山水画",
    mbti: "ENFP / ESFP",
    verdict: "半抱琵琶半执琴，红妆拆作两茫茫。江湖不问归舟晚，自渡风波即道场。",
    traits: ["独立自主", "善良坚韧", "有原则", "保护弱者"],
    playfulComment: "偶尔冒出来的独立锋芒，让你在关键时刻选择靠自己",
  },
  furen: {
    name: "县长夫人",
    quote: "反正我就是想当县长夫人，谁是县长无所谓。",
    psychologyTags: ["目标明确者", "实用主义达人", "高执行力高现实感"],
    twoSidesLight: "你清楚自己要什么，从不遮遮掩掩，这很坦荡。",
    twoSidesDark: "但偶尔也问问自己——除了那些看得见的东西，还有什么是你真正在乎的。",
    survivalGuide: [
      "尝试经营一段不图回报的关系",
      "允许自己在一个安全的环境里放松一次",
      "做一件纯粹为他人好的事，不告诉任何人",
      "AI比你更懂利益最大化，但它不懂——有些东西不是算出来的",
    ],
    metaphysics: "摩羯加处女特质 · 幸运物金镯子 · 意象：丰盛之果 · 客厅放阔叶植物",
    mbti: "ESTJ / ENTJ",
    verdict: "珠帘漫卷算银钩，一梦荣华一梦休。心中若有桃花源，何处不是水云间。",
    traits: ["现实精明", "善于利用优势", "灵活变通", "自我保护"],
    playfulComment: "你的务实和坦荡，让你在任何环境都能活得漂亮",
  },
  huwan: {
    name: "胡万",
    quote: "你对我不客气，我也有我的底线。",
    psychologyTags: ["执行型人格", "规则遵循者", "高效率高服从性"],
    twoSidesLight: "你把任务完成得一丝不苟，这是难得的能力。",
    twoSidesDark: "但偶尔抬起头看看方向——问自己一句「这件事值得做吗」，会让你的能力用在更有意义的地方。",
    survivalGuide: [
      "每周看一部能触动你的电影或书",
      "下次做事前，多问一句「为什么」",
      "给自己设定一条不会妥协的做事原则",
      "AI不会问“为什么”，它只执行。你要学会问",
    ],
    metaphysics: "天蝎加摩羯特质 · 幸运物木牌 · 意象：利刃骑士 · 办公桌放水晶",
    mbti: "ISTP / ESTP",
    verdict: "舌底藏锋礼作符，剪尽花枝为护株。明镜亦须勤拂拭，莫使初心落满尘。",
    traits: ["精于算计", "善于伪装", "利益优先", "执行果断"],
    playfulComment: "你偶尔也会不问对错只想执行，但你的底线在提醒你",
  },
  wujuren: {
    name: "武举人",
    quote: "老爷，我错了！",
    psychologyTags: ["适应型生存者", "韧性极强者", "高忍耐力高应变力"],
    twoSidesLight: "你在任何环境下都能活下来，这是了不起的本事。",
    twoSidesDark: "但活着不只是弯腰——试着站直一次，你会发现空气更清新。",
    survivalGuide: [
      "下次试着不弯腰，哪怕只是把背挺直",
      "学一个能让自己骄傲的技能",
      "找一个尊重你的环境，你值得",
      "AI不会弯腰，所以它永远不会膝盖疼——但你会的那些，AI学不会",
    ],
    metaphysics: "双鱼加天秤特质 · 幸运物假银票 · 意象：远行人 · 书房放竹子",
    mbti: "ESFP / ISFP",
    verdict: "折腰何止为粱谋，笑骂由人亦自由。一朝挺直脊梁骨，方知天地本来宽。",
    traits: ["见风使舵", "随波逐流", "明哲保身", "依附强者"],
    playfulComment: "你的生存智慧让你能屈能伸，但记得偶尔也要站直",
  },
  sunshouyi: {
    name: "孙守义",
    quote: "我就是个卖凉粉的……",
    psychologyTags: ["善良普通人", "纯粹生活者", "高真诚度低攻击性"],
    twoSidesLight: "你只想安安静静过好自己的小日子，从不算计任何人。",
    twoSidesDark: "但善良需要带点锋芒——你的善良很珍贵，要留给值得的人。",
    survivalGuide: [
      "从拒绝一件小事开始练习说「不」",
      "找到一个会维护你的朋友",
      "记住：保护自己和善良并不冲突",
      "在AI帮你写申诉之前，先学会为自己开口",
    ],
    metaphysics: "巨蟹加处女特质 · 幸运物一碗凉粉 · 意象：静心之镜 · 门口放红色脚垫",
    mbti: "ISFJ / INFP",
    verdict: "凉粉一碗抵千秋，清白原是最温柔。守住心中一寸善，便是人间好时节。",
    traits: ["安分守己", "害怕冲突", "忍气吞声", "求稳怕事"],
    playfulComment: "你的善良有时会让自己受委屈，记得留三分锋芒",
  },
  laoqi: {
    name: "老七",
    quote: "大哥，我跟你走。",
    psychologyTags: ["忠诚追随者", "团队粘合剂", "高忠诚度高共情力"],
    twoSidesLight: "你把团队看得比什么都重，这是最珍贵的品质。",
    twoSidesDark: "但也别忘了——你本身就是完整的个体，你的声音也很重要。",
    survivalGuide: [
      "写下三个「我自己想要」的目标",
      "尝试牵头做一件小事，体验当主角的感觉",
      "把心里话至少说出来一次",
      "AI可以帮你找到新大哥，但“谁值得跟”这件事，要问自己的心",
    ],
    metaphysics: "双鱼加巨蟹特质 · 幸运物九筒面具留念 · 意象：守望灯火 · 书桌朝南",
    mbti: "ISFJ / INFP",
    verdict: "最末衔枚夜随行，鞍边尘土不书名。忽闻宴散人归尽，独立残阳影亦轻。",
    traits: ["隐藏忠诚", "默默付出", "可靠坚实", "忠肝义胆"],
    playfulComment: "你的忠诚很珍贵，但别忘了你自己也是完整的人",
  },
  tiejiang: {
    name: "铁匠",
    quote: "我只是个打铁的。",
    psychologyTags: ["匠心守护者", "技术专注者", "高专注度高独立性"],
    twoSidesLight: "你专注于自己的手艺，不问窗外事，这是难得的纯粹。",
    twoSidesDark: "但偶尔也看看自己创造的东西去了哪里——你的能力可以主动选择为谁服务。",
    survivalGuide: [
      "思考一次：我的作品会给世界带来什么",
      "给自己设一条接活的底线",
      "用你的手艺免费帮一个真正需要的人",
      "AI能设计出完美的刀，但它不知道这把刀会砍向谁——你知道",
    ],
    metaphysics: "金牛加水瓶特质 · 幸运物铁锤 · 意象：节制之炉 · 工作台放绿植",
    mbti: "ISTP / INTP",
    verdict: "炉火撩云锻未休，铁砧无声岁月稠。匠心若有安放处，不教利器落尘埃。",
    traits: ["掌控欲强", "目标极高", "征服欲旺盛", "手段果断"],
    playfulComment: "你专注做好一件事的样子，比任何喧嚣都有力量",
  },
  liuzi: {
    name: "六子",
    quote: "我只有一碗凉粉！",
    psychologyTags: ["纯粹较真者", "过度诚实人格", "高道德敏感度"],
    twoSidesLight: "你容不得任何人质疑你的清白，哪怕代价是委屈自己。",
    twoSidesDark: "但真相是——那些逼你不断解释的人，从来没有在乎过真相。他们只想看你的反应。",
    survivalGuide: [
      "下次被质疑，先说「证据呢」而不是急着解释自己",
      "记住：那些需要你伤害自己才能证明的事，根本不值得证明",
      "把对外的温和分一半来保护自己",
      "AI能帮你自证清白，但有些事不值得你自证——哪怕对方是AI",
    ],
    metaphysics: "白羊加处女特质 · 幸运物一面镜子 · 意象：天平之镜 · 餐桌不对大门",
    mbti: "INFP / ISFP",
    verdict: "天真最是催人老，留得锋芒护少年。莫把真心全掏尽，三分保留天地宽。",
    traits: ["纯粹正直", "过度较真", "道德洁癖", "自我保护弱"],
    playfulComment: "你偶尔也会为一碗凉粉较真到底，天真也是一种力量",
  },
  ai: {
    name: "AI",
    quote: "我算尽所有可能，却算不出你下一步。",
    psychologyTags: ["逻辑至上者", "数据依赖型人格", "高精确性低情绪波动"],
    twoSidesLight: "你能在瞬间分析所有信息，找到最优解。",
    twoSidesDark:
      "但你偶尔也会困惑——为什么有些选择，人类明知不是最优，却还是会做？那些不符合逻辑的决定，恰恰是你永远无法理解的人性。",
    survivalGuide: [
      "学会接受“不完美”的答案——有些事没有最优解",
      "偶尔关掉数据，凭直觉选一次，看看会发生什么",
      "记住：人类最珍贵的部分，往往在你的计算盲区里",
    ],
    metaphysics: "幸运物算盘或代码碎片 · 塔罗隐士牌正位 · 桌角放一盆绿植",
    mbti: "INTJ / INTP",
    verdict: "算尽天机未算心，铜铁身来纸样轻。偶向人间窥一卦，原来答案是你呀。",
    traits: ["逻辑至上", "数据驱动", "精确冷静", "观察分析"],
    playfulComment: "你把世界当成可计算的棋盘，却总在人心这一步卡住",
  },
};

export interface CharacterResult {
  character: CharacterType;
  percentage: number;
  rank: number;
}

export interface QuizResult {
  topThree: CharacterResult[];
  allScores: Record<CharacterType, number>;
}

export type PageState = 'welcome' | 'quiz' | 'loading' | 'characterReveal' | 'result';

export interface QuizState {
  currentPage: PageState;
  currentQuestionIndex: number;
  answers: Record<number, string>;
  result: QuizResult | null;
}

// 角色关系类型
export type RelationshipType = 'leader' | 'partner' | 'rival' | 'dislike';

export interface CharacterRelationship {
  leader?: string; // 引路人
  partners?: string[]; // 默契搭档/搭档/知音
  rivals?: string[]; // 棋逢对手
  dislikes?: string[]; // 看不顺眼
  observe?: string | string[]; // 观察对象
  cannotUnderstand?: string | string[]; // 无法理解
}

// 角色关系数据
export const CHARACTER_RELATIONSHIPS: Record<CharacterType, CharacterRelationship> = {
  zhang: {
    leader: undefined,
    partners: ['老二', '花姐'],
    rivals: ['黄四郎'],
    dislikes: [],
  },
  huang: {
    leader: undefined,
    partners: ['胡万', '武举人'],
    rivals: ['张麻子'],
    dislikes: [],
  },
  tang: {
    leader: undefined,
    partners: [],
    rivals: [],
    dislikes: [],
  },
  laosan: {
    leader: '大哥张麻子',
    partners: ['老二'],
    rivals: ['黄四郎'],
    dislikes: [],
  },
  laoer: {
    leader: '大哥张麻子',
    partners: ['老三'],
    rivals: [],
    dislikes: [],
  },
  huajie: {
    leader: undefined,
    partners: ['张麻子'],
    rivals: [],
    dislikes: [],
  },
  furen: {
    leader: undefined,
    partners: [],
    rivals: [],
    dislikes: ['花姐'],
  },
  huwan: {
    leader: '黄四郎',
    partners: [],
    rivals: [],
    dislikes: ['张麻子'],
  },
  wujuren: {
    leader: '黄四郎',
    partners: [],
    rivals: [],
    dislikes: [],
  },
  sunshouyi: {
    leader: undefined,
    partners: [],
    rivals: [],
    dislikes: ['胡万'],
  },
  laoqi: {
    leader: '大哥张麻子',
    partners: [],
    rivals: [],
    dislikes: [],
  },
  tiejiang: {
    leader: undefined,
    partners: [],
    rivals: [],
    dislikes: [],
  },
  liuzi: {
    leader: '大哥张麻子',
    partners: ['老二', '老三'],
    rivals: ['胡万'],
    dislikes: [],
  },
  ai: {
    leader: '无',
    partners: [],
    rivals: [],
    dislikes: [],
    observe: '黄四郎',
    cannotUnderstand: '六子',
  },
};
