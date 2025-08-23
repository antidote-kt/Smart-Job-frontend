import request from "@/utils/request";

// 面试创建DTO接口
export interface InterviewCreateDTO {
  title: string
  position: string
  company: string
  interviewType: number
  difficultyLevel: number
  totalQuestions: number
}

// 答案提交DTO接口
export interface AnswerSubmitDTO {
  questionId: number
  userAnswer: string
}

// 面试VO接口
export interface InterviewVO {
  id: number
  title: string
  position: string
  company: string
  interviewType: number
  difficultyLevel: number
  status: number
  totalQuestions: number
  answeredQuestions: number
  overallScore: number // 后端是Double
  startTime?: string | number[] // 后端LocalDateTime可能序列化为字符串或数组
  endTime?: string | number[]
  report?: InterviewReport // 面试报告信息（已完成的面试才会包含）
}

// 面试题目VO接口
export interface InterviewQuestionVO {
  id: number
  questionText: string
  userAnswer: string
  answerTime: string // 后端是LocalDateTime，前端接收为ISO字符串
}

// 职位信息接口（保留原有的）
export interface JobPosition {
  id: number
  name: string
  category: string
  level: string
  description?: string
  requirements?: any
  skills?: any
}

// 问题响应接口
export interface QuestionResponse {
  question: string
  questionId?: number
}

// 答案评估接口
export interface AnswerEvaluation {
  id?: number
  qaRecordId?: number
  professionalScore: number
  logicScore: number
  completenessScore: number
  overallScore: number
  aiFeedback: string
  evaluationTime?: string
}

// 面试报告接口
export interface InterviewReport {
  id?: number
  sessionId: number
  overallScore: number
  professionalScore: number
  logicScore: number
  completenessScore: number
  performanceAnalysis: string
  skillAssessment: string
  improvementSuggestions: string
  strongPoints: string
  weakPoints: string
  generatedAt: string
  createdAt?: string
  updatedAt?: string
}

// 创建面试
export const createInterviewApi = (data: InterviewCreateDTO): Promise<InterviewVO> => {
  return request.post('/interview/create', data).then(res => res.data);
};

// 开始面试
export const startInterviewApi = (id: number): Promise<InterviewVO> => {
  return request.post(`/interview/${id}/start`).then(res => res.data);
};

// 提交答案
export const submitAnswerApi = (data: AnswerSubmitDTO): Promise<AnswerEvaluation> => {
  return request.post('/interview/submit-answer', data).then(res => {
    const evaluationVO = res.data;
    return {
      id: evaluationVO.id,
      qaRecordId: evaluationVO.qaRecordId,
      professionalScore: evaluationVO.professionalScore || 0,
      logicScore: evaluationVO.logicScore || 0,
      completenessScore: evaluationVO.completenessScore || 0,
      overallScore: evaluationVO.overallScore || 0,
      aiFeedback: evaluationVO.aiFeedback || '',
      evaluationTime: evaluationVO.evaluationTime
    };
  });
};

// 结束面试
export const finishInterviewApi = (id: number): Promise<InterviewVO> => {
  return request.post(`/interview/${id}/finish`).then(res => res.data);
};

// 获取用户面试列表
export const getUserInterviewsApi = (): Promise<InterviewVO[]> => {
  return request.get('/interview/list').then(res => res.data || []);
};

// 获取面试详情
export const getInterviewDetailApi = (id: number): Promise<InterviewVO> => {
  return request.get(`/interview/${id}`).then(res => res.data);
};

// 获取面试题目列表
export const getInterviewQuestionsApi = (id: number): Promise<InterviewQuestionVO[]> => {
  return request.get(`/interview/${id}/questions`).then(res => res.data || []);
};

// 删除面试
export const deleteInterviewApi = (id: number): Promise<void> => {
  return request.delete(`/interview/${id}`).then(res => res.data);
};

// 获取职位列表
export const getPositionsApi = (): Promise<JobPosition[]> => {
  return request.get('/positions').then(res => {
    const jobRequirements = res.data || [];
    return jobRequirements.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      level: item.level,
      description: item.description,
      requirements: Array.isArray(item.requirements) ? item.requirements.filter(r => r && r.trim()) : [],
      skills: Array.isArray(item.skills) ? item.skills.filter(s => s && s.trim()) : []
    }));
  });
};


// 流式API - 获取下一题流
export const getNextQuestionStreamApi = (sessionId: number): Promise<Response> => {
  const token = localStorage.getItem('token');
  return fetch(`/api/interview/${sessionId}/next-question-stream`, {
    method: 'GET',
    headers: {
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'authentication': token || ''
    }
  });
};

// 获取面试评价列表
export const getInterviewEvaluationsApi = (id: number): Promise<AnswerEvaluation[]> => {
  return request.get(`/interview/${id}/evaluations`).then(res => res.data || []);
};

// 管理岗位相关接口

// 创建岗位
export const createPositionApi = (data: JobPositionCreateDTO) => {
  const formattedData = {
    ...data,
    requirements: data.requirements.filter(r => r && r.trim()),
    skills: data.skills.filter(s => s && s.trim())
  };
  return request.post<JobPosition>('/positions', formattedData);
};

// 更新岗位
export const updatePositionApi = (id: number, data: JobPositionUpdateDTO) => {
  const formattedData = {
    ...data,
    requirements: data.requirements ? data.requirements.filter(r => r && r.trim()) : undefined,
    skills: data.skills ? data.skills.filter(s => s && s.trim()) : undefined
  };
  return request.put<JobPosition>(`/positions/${id}`, formattedData);
};

// 删除岗位
export const deletePositionApi = (id: number) => {
  return request.delete(`/positions/${id}`);
};

// 岗位相关类型定义
export interface JobPositionCreateDTO {
  name: string;
  category: string;
  level: string;
  description: string;
  requirements: string[];
  skills: string[];
}

export interface JobPositionUpdateDTO {
  name?: string;
  category?: string;
  level?: string;
  description?: string;
  requirements?: string[];
  skills?: string[];
}