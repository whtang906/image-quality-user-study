import { useEffect, useState } from 'react';
import { Button, Input, Progress, Select, Spin } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import _ from 'lodash';
import cx from 'classnames';
import moment from 'moment';
import numeral from 'numeral';

import inputJSON from '../../input.json';
import './style.less';

const { Option } = Select;

const {
  REACT_APP_B2_URL: B2_URL,
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
  let rankedImages = _.filter(currentQuestion.enhancedImages, (o) => o.rank !== undefined) || [];
  let effectiveRankedImages = _.uniqBy(rankedImages, 'rank') || [];
  let usedRanks = _.map(currentQuestion.enhancedImages, (o) => o.rank) || [];

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
          rank: enhancedImage.rank,
          created_at: moment().toISOString(),
        }));
      })
    );
    setIsLoading(false);
    setIsCompleted(true);
  };

  const generateRankOptionText = (rank, max) => {
    switch (rank) {
      case 1:
        return `${rank} (Best)`;
      case max:
        return `${rank} (Worst)`;
      default:
        return rank;
    }
  };

  useEffect(() => {
    const groupedInputJSON = _.groupBy(inputJSON, 'dataset');
    const datasets = Object.keys(groupedInputJSON);
    let questionBank = [];
    _.map(_.range(20), (i) => {
      while (true) {
        const datasetIdx = _.random(datasets.length - 1);
        const imageIdx = _.random(groupedInputJSON[datasets[datasetIdx]].length - 1);
        const targetImage = groupedInputJSON[datasets[datasetIdx]][imageIdx];
        if (!_.find(questionBank, { originalImage: targetImage.originalImage })) {
          const shuffledTargetImage = { ...targetImage, enhancedImages: _.shuffle(targetImage.enhancedImages) };
          questionBank.push(shuffledTargetImage);
          break;
        }
      }
    });
    setQuestions(questionBank);
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
            <p>This survey is finished.</p>
            <p>Thank you for your help!</p>
          </div>
        ) : (
          <div className="survey">
            <div className="header">
              <Progress percent={numeral(currentProgress * 100).format('0[.]00')} />
            </div>
            <div className="survey-body">
              {questions.length > 0 && currentQuestionIdx !== questions.length ? (
                <div className="question-container">
                  <p className="introduction">
                    Please rank the following images' enhancement quailty based on your first impression. <br />
                    (1: Best, {currentQuestion.enhancedImages ? currentQuestion.enhancedImages.length : 0}: Worst,{' '}
                    <b>duplicate rank is NOT allowed</b>)
                  </p>
                  <div className="input-image-section">
                    <img key={currentQuestion.originalImage} src={`${B2_URL}/${currentQuestion.inputImage}`} alt="" />
                    <p>
                      <b>Original Image</b>
                    </p>
                  </div>
                  <div className="enhanced-image-section">
                    {_.map(currentQuestion.enhancedImages, (enhancedImage, i) => {
                      return (
                        <div key={`${enhancedImage.name}-${i}`} className="enhanced-image">
                          <img src={`${B2_URL}/${enhancedImage.name}`} alt="" />
                          <p>Enhanced Image {i + 1}</p>
                          <Select
                            className={cx({
                              error: enhancedImage.rank && _.countBy(usedRanks)[enhancedImage.rank] > 1,
                            })}
                            placeholder="Rank this photo"
                            value={enhancedImage.rank}
                            onChange={(value) => {
                              let newQuestions = _.cloneDeep(questions);
                              newQuestions[currentQuestionIdx].enhancedImages[i].rank = value;
                              setQuestions(newQuestions);
                            }}
                            allowClear
                            dropdownMatchSelectWidth={false}
                          >
                            {_.map(_.range(1, currentQuestion.enhancedImages.length + 1), (rank) => (
                              <Option key={rank} value={rank}>
                                {generateRankOptionText(rank, currentQuestion.enhancedImages.length)}
                              </Option>
                            ))}
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                  <div className="button-section">
                    <Button
                      type="primary"
                      size="large"
                      disabled={
                        _.some(currentQuestion.enhancedImages, (enhancedImage) => enhancedImage.rank === undefined) ||
                        effectiveRankedImages.length !== currentQuestion.enhancedImages.length
                      }
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
          </div>
        )}
      </div>
    </Spin>
  );
};

export default UserStudyPage;
