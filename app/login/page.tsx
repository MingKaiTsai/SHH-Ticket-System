"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const demoAccounts: Record<string, { password: string; role: string }> = {
  applicant: { password: "demo1234", role: "applicant" },
  "applicant-int": { password: "demo1234", role: "applicant-int" },
  "media-a": { password: "demo1234", role: "media-a" },
  "media-b": { password: "demo1234", role: "media-b" },
  "media-c": { password: "demo1234", role: "media-c" },
  lead: { password: "demo1234", role: "lead" },
  approver: { password: "demo1234", role: "approver" },
  "approver-int": { password: "demo1234", role: "approver-int" },
};

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [username, setUsername] = useState("applicant");
  const [password, setPassword] = useState("demo1234");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const account = demoAccounts[username.trim()];

    if (!account || account.password !== password) {
      setError("帳號或密碼錯誤，請重新輸入。");
      return;
    }

    localStorage.setItem("demoRole", account.role);
    localStorage.setItem("demoUser", username);
    router.push("/dashboard");
  };

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="brand">
          <span className="brand-mark" />
          <div className="brand-text">
            <p className="brand-eyebrow">E170 REQUEST SYSTEM</p>
            <h1>登入工單系統</h1>
          </div>
        </div>
        <p className="login-note">
          Demo 已預填帳密，登入後可在 Dashboard 內切換角色。
        </p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>帳號</span>
            <input
              name="username"
              type="text"
              placeholder="輸入帳號"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label>
            <span>密碼</span>
            <input
              name="password"
              type="password"
              placeholder="輸入密碼"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button className="primary-btn" type="submit">
            登入
          </button>
          {error ? <p className="login-error">{error}</p> : null}
        </form>
        <div className="login-accounts">
          <p>示範帳號</p>
          <ul>
            <li>申請人-護理｜applicant / demo1234</li>
            <li>申請人-內科｜applicant-int / demo1234</li>
            <li>多媒體組員A｜media-a / demo1234</li>
            <li>多媒體組員B｜media-b / demo1234</li>
            <li>多媒體組員C｜media-c / demo1234</li>
            <li>多媒體組長｜lead / demo1234</li>
            <li>審核主管-護理｜approver / demo1234</li>
            <li>審核主管-內科｜approver-int / demo1234</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
