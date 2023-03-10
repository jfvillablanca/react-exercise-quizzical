import { useState } from "react";
import { nanoid } from "nanoid";
import { decode } from "he";

function shuffleArray(array) {
    const indexArray = array.map((_, index) => index);
    const shuffledIndexArray = indexArray
        .slice()
        .sort(() => Math.random() - 0.5);
    return shuffledIndexArray.map((index) => array[index]);
}

export default function Quiz({
    questionBank,
    quizIsFinished,
    resetQuiz,
    checkAnswers,
    quizLength,
}) {
    const [quizzes, setQuizzes] = useState(
        getQuestions(questionBank, quizLength)
    );
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [answeredAll, setAnsweredAll] = useState(false);

    function getQuestions(questionBank, quizLength) {
        const questions = questionBank
            .slice(0, quizLength)
            .map(({ question, correct_answer, incorrect_answers }) => {
                const shuffledChoices = shuffleArray([
                    {
                        choice: decode(correct_answer),
                        isCorrect: true,
                    },
                    ...incorrect_answers.map((answer) => ({
                        choice: decode(answer),
                        isCorrect: false,
                    })),
                ]);
                return {
                    id: nanoid(),
                    question: decode(question),
                    choices: shuffledChoices,
                };
            });

        return questions;
    }

    function handleSelect(id, choice) {
        setSelectedAnswers({
            ...selectedAnswers,
            [id]: choice,
        });
        setAnsweredAll(
            // HACK: +1 is caused by an off-by-one bug. Since
            // selectedAnswers gets updated on the next render,
            // the length update would happen in the future,
            // not now when it's needed lol. Thus: "+1"
            () => Object.keys(selectedAnswers).length + 1 >= quizzes.length
        );
    }

    function printQuestions() {
        return quizzes.map((quiz, index) => {
            return (
                <Question
                    key={quiz.id}
                    id={quiz.id}
                    questionNum={index + 1}
                    question={quiz.question}
                    choices={quiz.choices}
                    quizIsFinished={quizIsFinished}
                    selectedAnswer={selectedAnswers[quiz.id]}
                    handleSelect={(answerIndex) =>
                        handleSelect(quiz.id, quiz.choices[answerIndex])
                    }
                />
            );
        });
    }

    function playAgain() {
        setSelectedAnswers({});
        setAnsweredAll(false);
        setQuizzes(getQuestions(questionBank));
    }

    return (
        <div className='quiz'>
            {printQuestions()}
            <SubmitButton
                isAnsweredCompletely={answeredAll}
                handleClick={() =>
                    quizIsFinished ? resetQuiz(playAgain) : checkAnswers()
                }
                quizIsFinished={quizIsFinished}
                answers={selectedAnswers}
            />
        </div>
    );
}

function Question({
    id,
    questionNum,
    question,
    choices,
    quizIsFinished,
    selectedAnswer,
    handleSelect,
}) {
    function printQuizChoice(quizIsFinished) {
        return choices.map((option, i) => {
            const classSelect =
                (selectedAnswer === option ? "selected " : "") +
                (quizIsFinished ? "finished " : "") +
                (quizIsFinished && option.isCorrect
                    ? "correct "
                    : quizIsFinished && !option.isCorrect
                    ? "wrong "
                    : "") +
                `quiz-choice-${i}`;

            return (
                <button
                    className={classSelect}
                    id={`${i}-${id}`}
                    key={`${i}-${id}`}
                    onClick={() => handleSelect(i)}
                    disabled={quizIsFinished}
                >
                    {option.choice}
                </button>
            );
        });
    }

    return (
        <section>
            <h1 className='quiz-question'>
                Question {questionNum}: {question}
            </h1>
            <div className='quiz-choices'>
                {printQuizChoice(quizIsFinished)}
            </div>
        </section>
    );
}

function SubmitButton({
    isAnsweredCompletely,
    handleClick,
    quizIsFinished,
    answers,
}) {
    const [buttonClicked, setButtonClicked] = useState(false);

    const correctCount = Object.values(answers).filter(
        (choice) => choice.isCorrect
    ).length;
    const totalCount = Object.values(answers).length;

    return (
        <div
            className={
                "submit-container" + (!quizIsFinished ? " finished" : "")
            }
        >
            {quizIsFinished && (
                <p className='quiz-results'>
                    {`${correctCount}/${totalCount} correct answers`}
                </p>
            )}
            <button
                className='check-answers'
                onClick={() => {
                    setButtonClicked((prevButtonClicked) => {
                        if (quizIsFinished) {
                            return false;
                        }
                        return !prevButtonClicked;
                    });
                    isAnsweredCompletely && handleClick();
                }}
            >
                {quizIsFinished ? "Play again?" : "Check Answers"}
                {buttonClicked && !isAnsweredCompletely && (
                    <p>Pls answer all questions uwu</p>
                )}
            </button>
        </div>
    );
}
