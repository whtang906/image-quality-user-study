import { useEffect, useState } from 'react';
import { Button, Input, Progress, Rate, Spin } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import _ from 'lodash';

import inputJSON from '../../input.json';
import './style.less';

const {
  REACT_APP_GOOGLE_SERVICE_ACCOUNT_EMAL: GOOGLE_SERVICE_ACCOUNT_EMAIL,
  REACT_APP_GOOGLE_PRIVATE_KEY: GOOGLE_PRIVATE_KEY,
  REACT_APP_GOOGLE_DOC_ID: GOOGLE_DOC_ID,
  REACT_APP_GOOGLE_SHEET_ID: GOOGLE_SHEET_ID,
} = process.env;

const UserStudyPage = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [studentId, setStudentId] = useState();
  const [isCompleted, setIsCompleted] = useState(false);
  let currentQuestion = questions[currentQuestionIdx] || [];
  let currentProgress = currentQuestionIdx / questions.length;

  const submitResult = async () => {
    setIsLoading(true);
    const doc = new GoogleSpreadsheet(GOOGLE_DOC_ID);
    await doc.useServiceAccountAuth({
      client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[GOOGLE_SHEET_ID];
    await sheet.addRows(
      _.flatMap(questions, (question) => {
        return _.map(question.enhancedImages, (enhancedImage) => ({
          student_id: studentId,
          input_dataset: question.dataset,
          input_image: question.originalImage.split('.').pop(),
          enhanced_by: enhancedImage.model,
          score: enhancedImage.score,
        }));
      })
    );
    setIsLoading(false);
    setIsCompleted(true);
  };

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
    <Spin spinning={isLoading}>
      <div className="UsetStudyPage">
        {isCompleted ? (
          <div className="ending-screen">
            <CheckCircleOutlined />
            <p>The survey is finished.</p>
            <p>Thank you for your help!</p>
          </div>
        ) : (
          <div className="survey">
            <div className="header">
              <Progress percent={currentProgress * 100} />
            </div>
            <p>Please rate the following images' enhancement quailty. (0.5: Worst, 5: Best)</p>
            {questions.length > 0 && currentQuestionIdx !== questions.length ? (
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
                          allowHalf
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
                    disabled={_.some(
                      currentQuestion.enhancedImages,
                      (enhancedImage) => enhancedImage.score === undefined
                    )}
                    onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : (
              <div className="submit-section">
                <p>This survey is almost finished.</p>
                <p>Please input your student ID and submit the results.</p>
                <Input placeholder="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
                <Button type="primary" size="large" disabled={studentId === undefined} onClick={() => submitResult()}>
                  Submit
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Spin>
  );
};

export default UserStudyPage;
