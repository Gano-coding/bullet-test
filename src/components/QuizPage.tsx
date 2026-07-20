import { useState, useEffect } from "react";
import { soundManager } from "@/lib/sound";

interface QuizPageProps {
  question: {
    id: number;
    text: string;
    options: { id: string; text: string }[];
  };
  currentQuestionIndex: number;
  totalQuestions: number;
  onAnswer: (questionId: number, optionId: string) => void;
}

export default function QuizPage({
  question,
  currentQuestionIndex,
  totalQuestions,
  onAnswer,
}: QuizPageProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    setSelectedOption(null);
    soundManager.playProgress();
  }, [currentQuestionIndex, question?.id]);

  if (!question) {
    return (
      <div className="quiz-page">
        <p className="text-important">加载中...</p>
      </div>
    );
  }

  const handleOptionClick = (optionId: string) => {
    if (selectedOption) return;
    soundManager.playSelect();
    setSelectedOption(optionId);
    onAnswer(question.id, optionId);
  };

  const progressLabel = `${String(currentQuestionIndex + 1).padStart(2, "0")}/${totalQuestions}`;

  return (
    <div className="quiz-page">
      <div className="quiz-progress-corner">{progressLabel}</div>

      <div className="quiz-card quiz-question-enter" key={question.id}>
        <h2 className="quiz-question">{question.text}</h2>

        <div className="quiz-options">
          {question.options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleOptionClick(option.id)}
              className={`quiz-option ${selectedOption === option.id ? "selected" : ""}`}
            >
              <span className="quiz-option-id">{option.id.toUpperCase()}</span>
              <span className="quiz-option-text">{option.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
