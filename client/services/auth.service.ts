import api from "./api";

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  name: string;
  age: number;
  email: string;
  password: string;
  gender: string;
  role: "student" | "admin";
};

export const authService = {
  login: async (data: LoginPayload) => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  register: async (data: RegisterPayload) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};
