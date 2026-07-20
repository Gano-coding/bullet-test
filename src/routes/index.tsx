import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import WelcomePage from "@/components/WelcomePage";
import QuizPage from "@/components/QuizPage";
import LoadingPage from "@/components/LoadingPage";
import CharacterRevealPage from "@/components/CharacterRevealPage";
import ResultPage from "@/components/ResultPage";
import type { PageState, QuizResult, CharacterType, Question } from "@/types";
import { CHARACTER_INFO } from "@/types";
import { soundManager } from "@/lib/sound";

export const Route = createFileRoute("/")({
  component: Index,
});

// 12道性格测试题
const questions: Question[] = [
  {
    id: 1,
    text: "名头在手，银子在眼前，你先要哪个？",
    options: [
      { id: "a", text: "要名头。银子？先办正事。", character: "zhang" },
      { id: "b", text: "要银子。名头又不会自己跑掉。", character: "furen" },
      { id: "c", text: "先看看谁在盯着我，再决定要哪个。", character: "huang" },
      { id: "d", text: "两样都不急，先赔个笑，摸清底细再说。", character: "tang" },
    ],
  },
  {
    id: 2,
    text: "有人当面给你难堪，你怎么做？",
    options: [
      { id: "a", text: "当场回敬回去，绝不吃哑巴亏。", character: "laosan" },
      { id: "b", text: "笑着接住，回头再慢慢算。", character: "huwan" },
      { id: "c", text: "换个话题，忍了。", character: "sunshouyi" },
      { id: "d", text: "让他当众把话说清楚，还得道歉。", character: "zhang" },
    ],
  },
  {
    id: 3,
    text: "你最看不惯哪种人？",
    options: [
      { id: "a", text: "背叛兄弟的人。", character: "laoer" },
      { id: "b", text: "明明也贪，还装清高的人。", character: "tang" },
      { id: "c", text: "挡我财路的人。", character: "furen" },
      { id: "d", text: "比我狠还比我聪明的人。", character: "huang" },
    ],
  },
  {
    id: 4,
    text: "你发现有一个AI工具可以帮你做所有决定——从吃什么到和谁交朋友，你会？",
    options: [
      { id: "a", text: "拒绝使用，我要自己判断。", character: "zhang" },
      { id: "b", text: "先用着，但关键决定还是自己来。", character: "huajie" },
      { id: "c", text: "完全依赖它，省心省力。", character: "sunshouyi" },
      { id: "d", text: "研究它的算法，反向操控它为我所用。", character: "huang" },
    ],
  },
  {
    id: 5,
    text: "AI画了一幅比你想象中更美的你，但和真实的你不像，你会怎么处理这幅画？",
    options: [
      { id: "a", text: "销毁它，真相更重要。", character: "liuzi" },
      { id: "b", text: "留着欣赏，但心里知道那不是自己。", character: "tang" },
      { id: "c", text: "把它当成奋斗目标，努力活成画里的样子。", character: "laosan" },
      { id: "d", text: "拿去卖钱，反正别人觉得美。", character: "furen" },
    ],
  },
  {
    id: 6,
    text: "最好的兄弟要离开你单干，你的反应？",
    options: [
      { id: "a", text: "放他走，但这份交情我会一直记得。", character: "laosan" },
      { id: "b", text: "理解，但一个人喝闷酒到天亮。", character: "laoer" },
      { id: "c", text: "无所谓，反正天下没有不散的筵席。", character: "tang" },
      { id: "d", text: "嘴上祝福，背后给他使绊子。", character: "huwan" },
    ],
  },
  {
    id: 7,
    text: "路上看见普通人被地头蛇欺负，对方人多，怎么办？",
    options: [
      { id: "a", text: "绕道走，多一事不如少一事。", character: "sunshouyi" },
      { id: "b", text: "出声喝止，趁乱帮人脱身，然后快速离开。", character: "huajie" },
      { id: "c", text: "找机会把不义之财分给百姓，但绝不露脸。", character: "zhang" },
      { id: "d", text: "记下对方名字，回头告诉黄老爷——这地盘是我的。", character: "huang" },
    ],
  },
  {
    id: 8,
    text: "兄弟惹了大麻烦，上头要人，你怎么办？",
    options: [
      { id: "a", text: "按规矩办事，不徇私情。", character: "huwan" },
      { id: "b", text: "帮他遮掩一阵，但心里一直怕被牵连。", character: "furen" },
      { id: "c", text: "和他一起离开，路上骂他不争气。", character: "laosan" },
      { id: "d", text: "替他扛责任，让他先脱身。", character: "laoer" },
    ],
  },
  {
    id: 9,
    text: "钱被合作伙伴卷走了，怎么做？",
    options: [
      { id: "a", text: "找到他，让他连本带利吐出来。", character: "huang" },
      { id: "b", text: "认栽，然后想办法换下一家。", character: "tang" },
      { id: "c", text: "召集兄弟，天涯海角也要把人带回来。", character: "zhang" },
      { id: "d", text: "哭一场，然后当掉最后一件值钱的东西。", character: "furen" },
    ],
  },
  {
    id: 10,
    text: "你更喜欢哪种状态？",
    options: [
      { id: "a", text: "在人群中被拥护，被叫大哥。", character: "zhang" },
      { id: "b", text: "在暗处操纵一切，没人知道我的名字。", character: "huang" },
      { id: "c", text: "跟着靠谱的人混，不用动脑子。", character: "wujuren" },
      { id: "d", text: "谁也不靠，但饭桌上谁都得敬我。", character: "tang" },
    ],
  },
  {
    id: 11,
    text: "有人当众让你下不来台，你的反应？",
    options: [
      { id: "a", text: "当场翻脸，哪怕势弱也要争这口气。", character: "laosan" },
      { id: "b", text: "笑着赔罪，回家记一笔小账。", character: "huwan" },
      { id: "c", text: "记在心里，找机会让他尝到滋味。", character: "huang" },
      { id: "d", text: "不理他，但攒着一起算。", character: "zhang" },
    ],
  },
  {
    id: 12,
    text: "你理想中的成功是什么？",
    options: [
      { id: "a", text: "坐稳一方，无人敢轻慢。", character: "huang" },
      { id: "b", text: "发大财，去上海去美国。", character: "tang" },
      { id: "c", text: "身边有一群过命兄弟，走到哪都不怕。", character: "laoer" },
      { id: "d", text: "让有钱有势的人也尝尝被轻慢的滋味。", character: "zhang" },
    ],
  },
];

// 角色优先级排序(用于百分比相同时的排序)
const CHARACTER_PRIORITY: CharacterType[] = [
  "zhang", "huang", "tang", "laosan", "laoer", "huajie",
  "furen", "huwan", "wujuren", "sunshouyi", "liuzi", "ai", "laoqi", "tiejiang",
];

// 计算结果
function calculateResult(answers: Record<number, string>): QuizResult {
  // 初始化所有角色得分为0
  const scores: Record<CharacterType, number> = {
    zhang: 0, huang: 0, tang: 0, laosan: 0, laoer: 0, huajie: 0,
    furen: 0, huwan: 0, wujuren: 0, sunshouyi: 0, laoqi: 0, tiejiang: 0, liuzi: 0, ai: 0,
  };

  // 统计得分
  Object.entries(answers).forEach(([questionId, optionId]) => {
    const question = questions.find(q => q.id === Number(questionId));
    if (question) {
      const option = question.options.find(o => o.id === optionId);
      if (option) {
        scores[option.character] += 1;
      }
    }
  });

  // 检查隐藏角色触发条件
  let finalScores = { ...scores };

  const forceMain = (target: CharacterType) => {
    const maxScore = Math.max(...Object.values(finalScores));
    const topCharacter = CHARACTER_PRIORITY.find((c) => finalScores[c] === maxScore);
    if (topCharacter && topCharacter !== target) {
      finalScores[target] = maxScore;
      finalScores[topCharacter] = Math.max(0, finalScores[topCharacter] - 1);
    } else if (!topCharacter || topCharacter === target) {
      finalScores[target] = Math.max(finalScores[target], maxScore);
    }
  };

  // 隐藏角色强制主结果：按三甲优先级从低到高依次覆盖
  // 最终优先级：六子 > AI > 老七 > 铁匠
  const q1Answer = answers[1];
  const q3Answer = answers[3];
  const q4Answer = answers[4];
  const q5Answer = answers[5];
  const q6Answer = answers[6];
  const q7Answer = answers[7];
  const q8Answer = answers[8];
  const q10Answer = answers[10];
  const q11Answer = answers[11];
  const q12Answer = answers[12];

  // 铁匠：Q12选A + Q10选B + Q3选D
  if (q12Answer === "a" && q10Answer === "b" && q3Answer === "d") {
    forceMain("tiejiang");
  }

  // 老七：Q1选A + Q6选B + Q8选D（不变）
  if (q1Answer === "a" && q6Answer === "b" && q8Answer === "d") {
    forceMain("laoqi");
  }

  // AI：Q3选D + Q5选A + Q10选B
  if (q3Answer === "d" && q5Answer === "a" && q10Answer === "b") {
    forceMain("ai");
  }

  // 六子：Q4选C + Q7选A + Q11选B（最高优先级，最后判定）
  if (q4Answer === "c" && q7Answer === "a" && q11Answer === "b") {
    forceMain("liuzi");
  }

  // 计算百分比并排序
  const totalQuestions = 12;
  const characterResults = Object.entries(finalScores).map(([char, score]) => ({
    character: char as CharacterType,
    percentage: Math.round((score / totalQuestions) * 100),
    rank: 0,
  }));

  // 按百分比降序排序,百分比相同按优先级排序
  characterResults.sort((a, b) => {
    if (b.percentage !== a.percentage) {
      return b.percentage - a.percentage;
    }
    return CHARACTER_PRIORITY.indexOf(a.character) - CHARACTER_PRIORITY.indexOf(b.character);
  });

  // 分配排名
  characterResults.forEach((result, index) => {
    result.rank = index + 1;
  });

  // 取前三名
  const topThree = characterResults.slice(0, 3);

  return {
    topThree,
    allScores: finalScores,
  };
}

function Index() {
  const [pageState, setPageState] = useState<PageState>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  const handleStart = useCallback(() => {
    setPageState('quiz');
  }, []);

  const handleAnswer = useCallback((questionId: number, optionId: string) => {
    const nextAnswers = { ...answers, [questionId]: optionId };
    setAnswers(nextAnswers);

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setPageState('loading');

        setTimeout(() => {
          setResult(calculateResult(nextAnswers));
          setPageState('characterReveal');
        }, 3500);
      }
    }, 400);
  }, [currentQuestionIndex, answers]);

  const handleRestart = useCallback(() => {
    soundManager.stopBackgroundMusic();
    setPageState('welcome');
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResult(null);
  }, []);

  return (
    <div className="min-h-screen w-full">
      {pageState === 'welcome' && (
        <WelcomePage onStart={handleStart} />
      )}
      
      {pageState === 'quiz' && (
        <QuizPage
          question={questions[currentQuestionIndex]}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          onAnswer={handleAnswer}
        />
      )}
      
      {pageState === 'loading' && (
        <LoadingPage />
      )}

      {pageState === 'characterReveal' && result && (
        <CharacterRevealPage
          character={result.topThree[0].character}
          onComplete={() => setPageState('result')}
        />
      )}

      {pageState === 'result' && result && (
        <ResultPage result={result} onRestart={handleRestart} />
      )}
    </div>
  );
}
