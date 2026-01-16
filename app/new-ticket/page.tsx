"use client";

import { useRouter } from "next/navigation";
import { FormEvent } from "react";

export default function NewTicketPage() {
  const router = useRouter();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push("/dashboard");
  };

  return (
    <main className="container dashboard">
      <section className="panel">
        <div className="panel-head">
          <h3>新增申請</h3>
          <span className="panel-note">示範用表單，尚未寫入資料庫</span>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>申請單位</span>
            <input type="text" placeholder="輸入單位" required />
          </label>
          <label>
            <span>申請人</span>
            <input type="text" placeholder="輸入姓名" required />
          </label>
          <label>
            <span>職類</span>
            <select required>
              <option value="">請選擇</option>
              <option>護理</option>
              <option>行政</option>
              <option>語言治療</option>
              <option>營養</option>
            </select>
          </label>
          <label>
            <span>分機</span>
            <input type="text" placeholder="輸入分機" required />
          </label>
          <label>
            <span>主要用途</span>
            <select required>
              <option value="">請選擇</option>
              <option>教學研究</option>
              <option>醫學發表</option>
              <option>衛教宣導</option>
              <option>單位行銷</option>
              <option>行政公告</option>
              <option>空間標示</option>
              <option>校院活動</option>
              <option>外部競賽</option>
              <option>品牌行銷</option>
            </select>
          </label>
          <label>
            <span>申請類別</span>
            <select required>
              <option value="">請選擇</option>
              <option>海報輸出</option>
              <option>影片製作</option>
              <option>數位攝影</option>
              <option>平面設計</option>
            </select>
          </label>
          <label className="wide">
            <span>內容說明</span>
            <textarea rows={4} placeholder="請描述需求重點" />
          </label>
          <div className="form-actions">
            <button className="ghost-btn" type="button" onClick={() => router.back()}>
              取消
            </button>
            <button className="primary-btn" type="submit">
              送出申請
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
