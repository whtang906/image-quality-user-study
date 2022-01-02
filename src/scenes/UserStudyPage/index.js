import { useEffect, useState } from 'react';
import { Button, Progress, Rate } from 'antd';
import _ from 'lodash';

import inputJSON from '../../input.json';
import './style.less';

const UsetStudyPage = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  let currentQuestion = questions[currentQuestionIdx] || [];
  let currentProgress = currentQuestionIdx / questions.length;

  useEffect(() => {
    setQuestions(_.shuffle(inputJSON));
  }, []);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [currentQuestionIdx]);

  return (
    <div className="UsetStudyPage">
      <div className="header">
        <Progress percent={currentProgress * 100} />
      </div>
      {questions.length > 0 && (
        <div className="question-container">
          <div className="input-image-section">
            <img src={`/assets/${currentQuestion.inputImage}`} alt="" />
            <p>Original Image</p>
          </div>
          <div className="enhanced-image-section">
            {_.map(currentQuestion.enhancedImages, (enhancedImage, i) => {
              return (
                <div key={`${enhancedImage.name}-${i}`} className="enhanced-image">
                  <img src={`/assets/${enhancedImage.name}`} alt="" />
                  <p>Enhanced Image {i + 1}</p>
                  <Rate
                    value={enhancedImage.score}
                    onChange={(value) => {
                      let newQuestions = _.cloneDeep(questions);
                      newQuestions[currentQuestionIdx].enhancedImages[i].score = value;
                      setQuestions(newQuestions);
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="button-section">
            <Button
              type="primary"
              size="large"
              disabled={_.some(currentQuestion.enhancedImages, (enhancedImage) => enhancedImage.score === undefined)}
              onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsetStudyPage;
