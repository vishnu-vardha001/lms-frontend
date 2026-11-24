import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "./api.js";

function useUser() {
  const [user, setUser] = useState(undefined);
  useEffect(() => {
    api.me().then((data) => setUser(data.user)).catch(() => setUser(null));
  }, []);
  return [user, setUser];
}

function Shell({ user, setUser, children }) {
  async function signOut() {
    await api.logout();
    setUser(null);
  }
  return (
    <>
      <header className="top">
        <div className="wrap top-inner">
          <Link className="brand" to="/">Study Hall</Link>
          <nav className="nav">
            <Link to="/">Courses</Link>
            {user ? (
              <>
                {user.role === "instructor" ? <Link to="/teach">Teach</Link> : <Link to="/dashboard">My learning</Link>}
                <button className="ghost" type="button" onClick={signOut}>Sign out</button>
              </>
            ) : user === null ? (
              <>
                <Link to="/login">Sign in</Link>
                <Link className="button" to="/register">Create account</Link>
              </>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="wrap">{children}</main>
    </>
  );
}

function Progress({ done, lessons }) {
  if (!lessons || !done) return null;
  return (
    <>
      <div className="bar" aria-hidden="true"><span style={{ width: `${Math.round((done / lessons) * 100)}%` }} /></div>
      <div className="meta">{done} of {lessons} complete</div>
    </>
  );
}

function Catalog() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api.courses(q).then((data) => setCourses(data.courses)).catch((err) => setError(err.message));
  }, [q]);
  return (
    <>
      <h1>Courses you can start today</h1>
      <p className="lede">Pick a course, enroll, and work through the lessons. Progress is stored in Postgres.</p>
      <form className="search" onSubmit={(event) => {
        event.preventDefault();
        const next = new FormData(event.currentTarget).get("q");
        setParams(next ? { q: next } : {});
      }}>
        <input name="q" defaultValue={q} placeholder="Search courses" aria-label="Search courses" />
        <button type="submit">Search</button>
      </form>
      {error && <div className="flash">{error}</div>}
      {courses.length ? (
        <div className="grid">
          {courses.map((course) => (
            <article className="card" key={course.id}>
              <div className="meta">{course.level} · {course.lessons} lessons</div>
              <h2>{course.title}</h2>
              <p>{course.summary}</p>
              <div className="meta">{course.instructor_name}</div>
              <Progress done={course.done} lessons={course.lessons} />
              <Link className="button" to={`/courses/${course.id}`}>Open course</Link>
            </article>
          ))}
        </div>
      ) : <p>No courses match that search.</p>}
    </>
  );
}

function CoursePage({ user }) {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  function load() {
    api.course(id).then(setData).catch((err) => setError(err.message));
  }
  useEffect(load, [id]);
  if (error) return <div className="flash">{error}</div>;
  if (!data) return <p>Loading…</p>;
  const canOpen = data.enrolled || user?.role === "instructor";
  return (
    <>
      <p className="meta">{data.course.level} · {data.course.instructor_name}</p>
      <h1>{data.course.title}</h1>
      <p className="lede">{data.course.summary}</p>
      {user?.role === "student" && !data.enrolled && (
        <button type="button" onClick={async () => { await api.enroll(id); load(); }}>Enroll</button>
      )}
      {user?.role === "student" && data.enrolled && <p className="meta">You are enrolled. Open any lesson below.</p>}
      {!user && <Link className="button" to="/login">Sign in to enroll</Link>}
      <ol className="syllabus">
        {data.lessons.length ? data.lessons.map((lesson) => (
          <li key={lesson.id}>
            {canOpen ? <Link to={`/lessons/${lesson.id}`}>{lesson.position}. {lesson.title}</Link> : <span>{lesson.position}. {lesson.title}</span>}
            {data.done_ids.includes(lesson.id) && <span className="meta">Done</span>}
          </li>
        )) : <li>No lessons yet.</li>}
      </ol>
    </>
  );
}

function LessonPage({ user }) {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState("");
  function load() {
    setError("");
    api.lesson(id).then((data) => setLesson(data.lesson)).catch((err) => setError(err.message));
  }
  useEffect(load, [id]);
  if (!user) return <Navigate to="/login" replace />;
  if (error) return <div className="flash">{error}</div>;
  if (!lesson) return <p>Loading…</p>;
  return (
    <>
      <p className="meta"><Link to={`/courses/${lesson.course_id}`}>{lesson.course_title}</Link> · Lesson {lesson.position} of {lesson.total}</p>
      <h1>{lesson.title}</h1>
      <div className="lesson-body">{lesson.body}</div>
      <div className="row">
        {lesson.previous_id && <Link className="button ghost" to={`/lessons/${lesson.previous_id}`}>Previous</Link>}
        {user.role === "student" && (lesson.completed
          ? <span className="meta">Marked complete</span>
          : <button type="button" onClick={async () => { await api.complete(lesson.id); load(); }}>Mark complete</button>)}
        {lesson.next_id && <Link className="button" to={`/lessons/${lesson.next_id}`}>Next lesson</Link>}
      </div>
    </>
  );
}

function Dashboard({ user }) {
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (user) api.dashboard().then((data) => setCourses(data.courses)).catch((err) => setError(err.message));
  }, [user]);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "instructor") return <Navigate to="/teach" replace />;
  return (
    <>
      <h1>My learning</h1>
      <p className="lede">Courses you have enrolled in.</p>
      {error && <div className="flash">{error}</div>}
      {courses && (courses.length ? (
        <div className="grid">
          {courses.map((course) => (
            <article className="card" key={course.id}>
              <h2>{course.title}</h2>
              <p>{course.done} of {course.lessons} lessons complete</p>
              <div className="bar" aria-hidden="true"><span style={{ width: `${course.lessons ? Math.round((course.done / course.lessons) * 100) : 0}%` }} /></div>
              <Link className="button" to={`/courses/${course.id}`}>Continue</Link>
            </article>
          ))}
        </div>
      ) : <p>You have not enrolled yet. <Link to="/">Browse courses</Link>.</p>)}
    </>
  );
}

function Teach({ user }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (user?.role === "instructor") api.teach().then((data) => setCourses(data.courses)).catch((err) => setError(err.message));
  }, [user]);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "instructor") return <Navigate to="/dashboard" replace />;
  return (
    <>
      <h1>Your courses</h1>
      {error && <div className="flash">{error}</div>}
      <div className="split">
        <div className="grid">
          {courses.map((course) => (
            <article className="card" key={course.id}>
              <div className="meta">{course.level} · {course.lessons} lessons</div>
              <h2>{course.title}</h2>
              <Link className="button" to={`/teach/${course.id}`}>Add lessons</Link>
            </article>
          ))}
        </div>
        <form className="form" onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          try {
            const created = await api.createCourse({
              title: form.get("title"),
              summary: form.get("summary"),
              level: form.get("level"),
            });
            navigate(`/teach/${created.id}`);
          } catch (err) {
            setError(err.message);
          }
        }}>
          <h2>New course</h2>
          <label>Title <input name="title" required maxLength={80} /></label>
          <label>Summary <textarea name="summary" required maxLength={240} /></label>
          <label>Level
            <select name="level">
              <option>Beginner</option>
              <option>Intermediate</option>
            </select>
          </label>
          <button type="submit">Create course</button>
        </form>
      </div>
    </>
  );
}

function Manage({ user }) {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  function load() {
    api.manage(id).then(setData).catch((err) => setError(err.message));
  }
  useEffect(load, [id]);
  if (!user) return <Navigate to="/login" replace />;
  if (error) return <div className="flash">{error}</div>;
  if (!data) return <p>Loading…</p>;
  return (
    <>
      <p className="meta"><Link to="/teach">Your courses</Link></p>
      <h1>{data.course.title}</h1>
      <div className="split">
        <ol className="syllabus">
          {data.lessons.length ? data.lessons.map((lesson) => (
            <li key={lesson.id}><Link to={`/lessons/${lesson.id}`}>{lesson.position}. {lesson.title}</Link></li>
          )) : <li>No lessons yet.</li>}
        </ol>
        <form className="form" onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          try {
            await api.addLesson(id, { title: form.get("title"), body: form.get("body") });
            event.currentTarget.reset();
            load();
          } catch (err) {
            setError(err.message);
          }
        }}>
          <h2>New lesson</h2>
          <label>Title <input name="title" required maxLength={80} /></label>
          <label>Lesson text <textarea name="body" required /></label>
          <button type="submit">Add lesson</button>
        </form>
      </div>
    </>
  );
}

function Login({ setUser }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  return (
    <>
      <h1>Sign in</h1>
      <form className="form" onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        try {
          const data = await api.login({ email: form.get("email"), password: form.get("password") });
          setUser(data.user);
          navigate(data.user.role === "instructor" ? "/teach" : "/dashboard");
        } catch (err) {
          setError(err.message);
        }
      }}>
        {error && <div className="flash">{error}</div>}
        <label>Email <input type="email" name="email" required /></label>
        <label>Password <input type="password" name="password" required /></label>
        <button type="submit">Sign in</button>
      </form>
      <p className="note">New here? <Link to="/register">Create a student account</Link>.</p>
      <p className="note">Instructor: vishnuvardhanreddypagunta@gmail.com / studyhall123. Student demo: student@lms.local / student123.</p>
    </>
  );
}

function Register({ setUser }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  return (
    <>
      <h1>Create a student account</h1>
      <form className="form" onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        try {
          const data = await api.register({
            name: form.get("name"),
            email: form.get("email"),
            password: form.get("password"),
          });
          setUser(data.user);
          navigate("/dashboard");
        } catch (err) {
          setError(err.message);
        }
      }}>
        {error && <div className="flash">{error}</div>}
        <label>Name <input name="name" required maxLength={80} /></label>
        <label>Email <input type="email" name="email" required /></label>
        <label>Password <input type="password" name="password" required minLength={6} /></label>
        <button type="submit">Create account</button>
      </form>
      <p className="note">Already registered? <Link to="/login">Sign in</Link>.</p>
    </>
  );
}

export default function App() {
  const [user, setUser] = useUser();
  return (
    <Shell user={user} setUser={setUser}>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/courses/:id" element={<CoursePage user={user} />} />
        <Route path="/lessons/:id" element={<LessonPage user={user} />} />
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/teach" element={<Teach user={user} />} />
        <Route path="/teach/:id" element={<Manage user={user} />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register setUser={setUser} />} />
      </Routes>
    </Shell>
  );
}
