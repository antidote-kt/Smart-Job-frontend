import request from "@/utils/request";

// 用户信息接口 - 对应后端User实体
export interface User {
  id: number
  username: string
  email: string
  nickname?: string
  createdAt: string
  updatedAt: string
  status: number // 1-正常 0-禁用
}

// 登录请求接口
export interface LoginRequest {
  username: string
  password: string
}

// 注册请求接口
export interface RegisterRequest {
  username: string
  email: string
  password: string
  nickname?: string
}

// 登录响应接口
export interface LoginResponse {
  token: string
  userId: number
}

// 登录
export const loginApi = (data: LoginRequest): Promise<LoginResponse> => {
  return request.post("/auth/login", data).then(res => res.data);
};

// 注册
export const registerApi = (data: RegisterRequest): Promise<void> => {
  return request.post("/auth/register", data).then(res => res.data);
};

// 退出登录
export const logoutApi = (): Promise<void> => {
  return request.post("/auth/logout").then(res => res.data);
};

// 获取用户信息
export const getProfileApi = (): Promise<User> => {
  return request.get("/auth/profile").then(res => res.data);
};

// 更新用户信息
export const updateProfileApi = (data: Partial<User>): Promise<void> => {
  return request.put("/auth/profile", data).then(res => res.data);
};

// 修改密码
export const changePasswordApi = (currentPassword: string, newPassword: string): Promise<void> => {
  return request.put("/auth/password", { oldPassword: currentPassword, newPassword }).then(res => res.data);
};