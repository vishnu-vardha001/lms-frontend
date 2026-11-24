import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "./api.js";

function useUser() {
  const [user, setUser] = useState(undefined);
  useEffect(() => {
    api.me().then((data) => setUser(data.user)).catch(() => setUser(null));
  }, []);
  return [user, setUser];
}

function Brand() {
  return (
    <Link className="brand" to="/">
      <span className="mark">W</span>
      Wave Academy
    </Link>
  );
}

function Shell({ user, setUser }) {
  async function signOut() {
    await api.logout();
    setUser(null);
  }
  if (user === undefined) return <p className="stage">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="portal">
      <aside className="side">
        <Brand />
        <nav className="menu">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/journey">My Journey</NavLink>
          <NavLink to="/courses">Courses</NavLink>
          <NavLink to="/questions">Question Bank</NavLink>
          <NavLink to="/exams">Course Exams</NavLink>
          {user.role === "instructor" && <NavLink to="/teach">Teach</NavLink>}
          {user.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div className="side-foot">
          <div className="who"><strong>{user.name}</strong>{user.role}</div>
          <button className="ghost" type="button" onClick={signOut}>Sign out</button>
        </div>
      </aside>
      <main className="stage"><Outlet /></main>
    </div>
  );
}

function Progress({ done, lessons }) {
  const width = lessons ? Math.round((done / lessons) * 100) : 0;
  return <div className="bar" aria-hidden="true"><span style={{ width: `${width}%` }} /></div>;
}

function Home({ user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api.home().then(setData).catch((err) => setError(err.message));
  }, []);
  if (error) return <div className="flash">{error}</div>;
  if (!data) return <p>Loading your portal…</p>;
  const first = user.name.split(" ")[0];
  return (
    <>
      <div className="page-head">
        <h1>Welcome, {first}</h1>
        <p className="lede">Your day in the academy: what is next, what is coming up, and where you stand.</p>
      </div>
      <section className="stats">
        <article className="stat"><span>Streak</span><strong>{data.streak} days</strong></article>
        <article className="stat"><span>Consistency</span><strong>{data.consistency}%</strong></article>
        <article className="stat"><span>Leaderboard</span><strong>#{data.rank || "–"}</strong></article>
      </section>
      {data.continue && (
        <section className="continue">
          <div>
            <div className="kind">{data.continue.cycle_title || "Continue"}</div>
            <h2>{data.continue.title}</h2>
            <p>{data.continue.done} of {data.continue.lessons} lessons complete</p>
            <Progress done={data.continue.done} lessons={data.continue.lessons} />
          </div>
          <Link className="button" to={`/courses/${data.continue.id}`}>Resume</Link>
        </section>
      )}
      <div className="layout">
        <section className="stack">
          <article className="panel">
            <h2>Today’s schedule</h2>
            {data.schedule.length ? (
              <ul className="schedule">
                {data.schedule.map((item) => (
                  <li key={item.id}>
                    <div>
                      <Link to={`/lessons/${item.id}`}>{item.title}</Link>
                      <div className="muted">{item.course_title}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="muted">You are caught up. Review the question bank or an exam.</p>}
          </article>
          <article className="panel">
            <h2>Events</h2>
            <ul className="events">
              {data.events.map((event) => (
                <li key={event.id}>
                  <div>
                    <div className="kind">{event.kind}</div>
                    <strong>{event.title}</strong>
                    <div className="muted">{event.detail}</div>
                  </div>
                  <span className="muted">{event.when_label}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>
        <article className="panel">
          <h2>Leaderboard</h2>
          <p className="muted">You have {data.points} points.</p>
          <ul className="board">
            {data.leaderboard.map((row) => (
              <li key={row.id}>
                <div><span className="rank">{row.rank}</span><strong>{row.name}</strong></div>
                <span>{row.points}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </>
  );
}

function Journey() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(1);
  const [error, setError] = useState("");
  useEffect(() => {
    api.journey().then(setData).catch((err) => setError(err.message));
  }, []);
  if (error) return <div className="flash">{error}</div>;
  if (!data) return <p>Loading your journey…</p>;
  return (
    <>
      <div className="page-head">
        <h1>My Journey</h1>
        <p className="lede">Growth cycles unlock in order. Finish one cycle and the next one opens.</p>
      </div>
      {data.cycles.map((cycle) => (
        <section className={open === cycle.position ? "cycle open" : "cycle"} key={cycle.id}>
          <button className="cycle-head" type="button" onClick={() => setOpen(cycle.position)}>
            <div className="cycle-top">
              <h2>{cycle.title}</h2>
              <span className={cycle.status === "Completed" ? "tag done" : cycle.unlocked ? "tag live" : "tag lock"}>
                {cycle.status}
              </span>
            </div>
            <p className="muted">{cycle.skill}</p>
            <Progress done={cycle.percent} lessons={100} />
            <p className="muted">{cycle.percent}% complete</p>
          </button>
          {open === cycle.position && (
            <div className="cycle-body">
              <p>{cycle.summary}</p>
              <ul className="syllabus">
                {cycle.courses.map((course) => (
                  <li key={course.id}>
                    {cycle.unlocked ? (
                      <Link to={`/courses/${course.id}`}>{course.title}</Link>
                    ) : (
                      <span>{course.title}</span>
                    )}
                    <span className="muted">{course.done}/{course.lessons}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ))}
    </>
  );
}

function Courses() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api.courses(q).then((data) => setCourses(data.courses)).catch((err) => setError(err.message));
  }, [q]);
  return (
    <>
      <div className="page-head">
        <h1>Courses</h1>
        <p className="lede">Academy courses plus anything your instructor publishes.</p>
      </div>
      <form className="search" onSubmit={(event) => {
        event.preventDefault();
        const next = new FormData(event.currentTarget).get("q");
        setParams(next ? { q: next } : {});
      }}>
        <input name="q" defaultValue={q} placeholder="Search topics, units, courses" aria-label="Search courses" />
        <button type="submit">Search</button>
      </form>
      {error && <div className="flash">{error}</div>}
      <div className="grid">
        {courses.map((course) => (
          <article className="card" key={course.id}>
            <div className="muted">{course.level} · {course.lessons} lessons</div>
            <h2>{course.title}</h2>
            <p>{course.summary}</p>
            <Progress done={course.done} lessons={course.lessons} />
            {course.request_status === "pending" && <span className="tag live">Request pending</span>}
            {course.request_status === "rejected" && <span className="tag lock">Request declined</span>}
            <Link className="button" to={`/courses/${course.id}`}>
              {course.done || course.request_status === "approved" ? "Open" : "View course"}
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}

function CoursePage({ user }) {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  function load() {
    api.course(id).then(setData).catch((err) => setError(err.message));
  }
  useEffect(load, [id]);
  if (error) return <div className="flash">{error}</div>;
  if (!data) return <p>Loading…</p>;
  const canOpen = data.enrolled || user?.role === "instructor" || user?.role === "admin";
  const waiting = data.request_status === "pending";
  return (
    <>
      <p className="muted">{data.course.level} · {data.course.instructor_name}</p>
      <div className="page-head">
        <h1>{data.course.title}</h1>
        <p className="lede">{data.course.summary}</p>
      </div>
      {data.enrolled && user?.role === "student" && <span className="tag done">You are in this course</span>}
      {data.certificate && <p className="meta">Certificate {data.certificate}</p>}
      {waiting && <p className="muted">Your request is with the admin. Lessons open after it is approved.</p>}
      {user?.role === "student" && !data.enrolled && !waiting && (
        <form className="form" onSubmit={async (event) => {
          event.preventDefault();
          try {
            await api.askToJoin(id, note);
            setNote("");
            load();
          } catch (err) {
            setError(err.message);
          }
        }}>
          <h2>{data.request_status === "rejected" ? "Ask again" : "Ask to join"}</h2>
          <label>Note for the admin
            <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={240} placeholder="Why do you want this course?" />
          </label>
          <button type="submit">Send request</button>
        </form>
      )}
      <ol className="syllabus">
        {data.lessons.map((lesson) => (
          <li key={lesson.id}>
            {canOpen ? <Link to={`/lessons/${lesson.id}`}>{lesson.module_title ? `${lesson.module_title} · ` : ""}{lesson.position}. {lesson.title}</Link> : <span>{lesson.module_title ? `${lesson.module_title} · ` : ""}{lesson.position}. {lesson.title}</span>}
            {data.done_ids.includes(lesson.id) && <span className="tag done">Done</span>}
          </li>
        ))}
      </ol>
    </>
  );
}

function LessonPage({ user }) {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState("");
  const [code, setCode] = useState("print(\"Hello from PythonLife\")\n");
  const [output, setOutput] = useState("");
  function load() {
    api.lesson(id).then((data) => setLesson(data.lesson)).catch((err) => setError(err.message));
  }
  useEffect(load, [id]);
  if (error) return <div className="flash">{error}</div>;
  if (!lesson) return <p>Loading…</p>;
  return (
    <>
      <p className="muted"><Link to={`/courses/${lesson.course_id}`}>{lesson.course_title}</Link> · {lesson.module_title ? `${lesson.module_title} · ` : ""}Lesson {lesson.position} of {lesson.total}</p>
      <div className="page-head"><h1>{lesson.title}</h1></div>
      {lesson.video_id && (
        <div className="lesson-body">
          <iframe
            title={lesson.title}
            src={`https://www.youtube-nocookie.com/embed/${lesson.video_id}?rel=0&modestbranding=1&playsinline=1`}
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
            style={{ width: "100%", aspectRatio: "16 / 9", border: 0 }}
          />
        </div>
      )}
      <div className="lesson-body">{lesson.body}</div>
      {lesson.practice && (
        <form className="form" onSubmit={async (event) => {
          event.preventDefault();
          try {
            const result = await api.runCode(lesson.id, code);
            setOutput(result.output);
          } catch (err) {
            setError(err.message);
          }
        }}>
          <h2>Run Python</h2>
          <label>Code
            <textarea value={code} onChange={(event) => setCode(event.target.value)} />
          </label>
          <button type="submit">Run</button>
          {output && <pre className="lesson-body">{output}</pre>}
        </form>
      )}
      <div className="row">
        {lesson.previous_id && <Link className="button ghost" to={`/lessons/${lesson.previous_id}`}>Previous</Link>}
        {user.role === "student" && (lesson.completed
          ? <span className="tag done">Marked complete</span>
          : <button type="button" onClick={async () => { await api.complete(lesson.id); load(); }}>Mark complete</button>)}
        {lesson.next_id && <Link className="button" to={`/lessons/${lesson.next_id}`}>Next lesson</Link>}
      </div>
    </>
  );
}

function QuestionBank() {
  const [status, setStatus] = useState("");
  const [courseId, setCourseId] = useState("");
  const [topic, setTopic] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  function load() {
    api.questions({ status, courseId, topic }).then(setData).catch((err) => setError(err.message));
  }
  useEffect(load, [status, courseId, topic]);
  if (error) return <div className="flash">{error}</div>;
  if (!data) return <p>Loading questions…</p>;
  return (
    <>
      <div className="page-head">
        <h1>Question Bank</h1>
        <p className="lede">Every practice problem from your courses, in one list. It unlocks after Growth Cycle 1.</p>
      </div>
      {!data.unlocked ? (
        <article className="panel">
          <h2>Locked</h2>
          <p>Finish both courses in Growth Cycle 1. The bank then stays in sync with your course progress.</p>
          <Link className="button" to="/journey">Go to My Journey</Link>
        </article>
      ) : (
        <>
          <div className="filters">
            <select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
            <select aria-label="Course" value={courseId} onChange={(event) => setCourseId(event.target.value)}>
              <option value="">All courses</option>
              {data.courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
            <select aria-label="Topic" value={topic} onChange={(event) => setTopic(event.target.value)}>
              <option value="">All topics</option>
              {data.topics.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          {data.questions.length ? data.questions.map((question) => (
            <article className="q-card" key={question.id}>
              <div className="cycle-top">
                <h2>{question.title}</h2>
                <span className={question.status === "Completed" ? "tag done" : "tag live"}>{question.status}</span>
              </div>
              <p className="muted">{question.course_title} · {question.topic} · {question.difficulty}</p>
              <p>{question.prompt}</p>
              {question.status !== "Completed" && (
                <button type="button" onClick={async () => { await api.solve(question.id); load(); }}>Mark solved</button>
              )}
            </article>
          )) : <p>No questions match those filters.</p>}
        </>
      )}
    </>
  );
}

function Exams() {
  const [exams, setExams] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api.exams().then((data) => setExams(data.exams)).catch((err) => setError(err.message));
  }, []);
  if (error) return <div className="flash">{error}</div>;
  if (!exams) return <p>Loading exams…</p>;
  return (
    <>
      <div className="page-head">
        <h1>Course Exams</h1>
        <p className="lede">A short timed check at the end of each course. Finish the lessons to unlock it. Your best score stays on the card.</p>
      </div>
      {exams.map((exam) => (
        <article className="exam-card" key={exam.id}>
          <div className="cycle-top">
            <h2>{exam.title}</h2>
            <span className={exam.eligible ? "tag done" : "tag lock"}>{exam.eligible ? "Open" : "Locked"}</span>
          </div>
          <p className="muted">{exam.course_title} · {exam.minutes} min · {exam.total_marks} marks</p>
          <p>{exam.best_score == null ? "No attempt yet" : `Best score ${exam.best_score} / ${exam.total_marks} · ${exam.attempts} attempt${exam.attempts === 1 ? "" : "s"}`}</p>
          {exam.eligible ? <Link className="button" to={`/exams/${exam.id}`}>Start exam</Link> : <p className="muted">Complete every lesson in this course first.</p>}
        </article>
      ))}
    </>
  );
}

function ExamRoom() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [left, setLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.exam(id).then((payload) => {
      setData(payload);
      setAnswers(payload.questions.map(() => null));
      setLeft(payload.exam.minutes * 60);
    }).catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (!started || result) return undefined;
    const timer = setInterval(() => {
      setLeft((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [started, result]);

  async function submit() {
    try {
      const score = await api.submitExam(id, answers);
      setResult(score);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (started && left === 0 && !result) submit();
  }, [left, started, result]);

  if (error) return <div className="flash">{error}</div>;
  if (!data) return <p>Loading exam…</p>;
  const minutes = String(Math.floor(left / 60)).padStart(2, "0");
  const seconds = String(left % 60).padStart(2, "0");

  if (!data.exam.eligible) {
    return (
      <article className="panel">
        <h1>{data.exam.title}</h1>
        <p>This exam stays locked until every lesson in {data.exam.course_title} is complete.</p>
        <Link className="button" to="/journey">Back to My Journey</Link>
      </article>
    );
  }

  if (result) {
    return (
      <article className="panel">
        <h1>Score {result.score} / {result.max_score}</h1>
        <p>That attempt is saved. You can retake the exam if you want a higher score.</p>
        <div className="row">
          <Link className="button" to="/exams">All exams</Link>
          <button type="button" onClick={() => { setResult(null); setStarted(false); setLeft(data.exam.minutes * 60); }}>Retake</button>
        </div>
      </article>
    );
  }

  if (!started) {
    return (
      <article className="panel">
        <h1>{data.exam.title}</h1>
        <p>{data.exam.instructions}</p>
        <p className="muted">{data.exam.minutes} minutes · {data.exam.total_marks} marks · {data.questions.length} questions</p>
        <button type="button" onClick={() => setStarted(true)}>Begin</button>
      </article>
    );
  }

  return (
    <>
      <div className="cycle-top">
        <h1>{data.exam.title}</h1>
        <span className="timer">{minutes}:{seconds}</span>
      </div>
      {data.questions.map((question, index) => (
        <article className="q-card" key={question.id}>
          <h2>{index + 1}. {question.prompt}</h2>
          <p className="muted">{question.marks} marks</p>
          {question.options.map((option, optionIndex) => (
            <label className="choice" key={option}>
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={answers[index] === optionIndex}
                onChange={() => setAnswers((current) => current.map((value, item) => item === index ? optionIndex : value))}
              />
              <span>{option}</span>
            </label>
          ))}
        </article>
      ))}
      <button type="button" onClick={submit}>Submit exam</button>
    </>
  );
}

function Admin({ user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  function load() {
    api.admin().then(setData).catch((err) => setError(err.message));
  }
  useEffect(load, []);
  if (user.role !== "admin") return <Navigate to="/" replace />;
  if (error) return <div className="flash">{error}</div>;
  if (!data) return <p>Loading the admin desk…</p>;
  return (
    <>
      <div className="page-head">
        <h1>Admin</h1>
        <p className="lede">Students ask to join a course. Approve a request to enroll them, or decline it.</p>
      </div>
      <section className="stats">
        <article className="stat"><span>Pending requests</span><strong>{data.counts.pending}</strong></article>
        <article className="stat"><span>Students</span><strong>{data.counts.students}</strong></article>
        <article className="stat"><span>Courses</span><strong>{data.counts.courses}</strong></article>
      </section>
      <article className="panel">
        <h2>Join requests</h2>
        {data.requests.length ? (
          <table className="requests">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Note</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.requests.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.student_name}</strong>
                    <div className="muted">{item.student_email}</div>
                  </td>
                  <td>{item.course_title}</td>
                  <td>{item.note || "—"}</td>
                  <td><span className={item.status === "approved" ? "tag done" : item.status === "pending" ? "tag live" : "tag lock"}>{item.status}</span></td>
                  <td>
                    {item.status === "pending" && (
                      <div className="row">
                        <button type="button" onClick={async () => { await api.decideRequest(item.id, "approved"); load(); }}>Approve</button>
                        <button className="ghost" type="button" onClick={async () => { await api.decideRequest(item.id, "rejected"); load(); }}>Decline</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="muted">No one has asked to join a course yet.</p>}
      </article>
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
  if (user.role !== "instructor") return <Navigate to="/" replace />;
  return (
    <>
      <div className="page-head"><h1>Your courses</h1></div>
      {error && <div className="flash">{error}</div>}
      <div className="split">
        <div className="grid">
          {courses.map((course) => (
            <article className="card" key={course.id}>
              <div className="muted">{course.level} · {course.lessons} lessons</div>
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
  if (user.role !== "instructor") return <Navigate to="/" replace />;
  if (error) return <div className="flash">{error}</div>;
  if (!data) return <p>Loading…</p>;
  return (
    <>
      <p className="muted"><Link to="/teach">Your courses</Link></p>
      <div className="page-head"><h1>{data.course.title}</h1></div>
      <div className="split">
        <ol className="syllabus">
          {data.lessons.map((lesson) => (
            <li key={lesson.id}><Link to={`/lessons/${lesson.id}`}>{lesson.position}. {lesson.title}</Link></li>
          ))}
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
    <div className="auth">
      <section className="auth-copy">
        <Brand />
        <h1>Your learning portal</h1>
        <p>A home dashboard, a growth-cycle journey, a question bank, and a course exam after each course.</p>
      </section>
      <form className="auth-form form" onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        try {
          const data = await api.login({ email: form.get("email"), password: form.get("password") });
          setUser(data.user);
          navigate(data.user.role === "instructor" ? "/teach" : data.user.role === "admin" ? "/admin" : "/");
        } catch (err) {
          setError(err.message);
        }
      }}>
        <h1>Sign in</h1>
        {error && <div className="flash">{error}</div>}
        <label>Email <input type="email" name="email" required /></label>
        <label>Password <input type="password" name="password" required /></label>
        <button type="submit">Sign in</button>
        <p className="note">New here? <Link to="/register">Create a student account</Link>.</p>
        <p className="note">Student demo: student@lms.local / student123</p>
        <p className="note">Admin: admin@wave.local / admin123</p>
        <p className="note">Instructor: vishnuvardhanreddypagunta@gmail.com / studyhall123</p>
      </form>
    </div>
  );
}

function Register({ setUser }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  return (
    <div className="auth">
      <section className="auth-copy">
        <Brand />
        <h1>Join the academy</h1>
        <p>After you sign in, ask to join a course. An admin approves the request before the lessons open.</p>
      </section>
      <form className="auth-form form" onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        try {
          const data = await api.register({
            name: form.get("name"),
            email: form.get("email"),
            password: form.get("password"),
          });
          setUser(data.user);
          navigate("/");
        } catch (err) {
          setError(err.message);
        }
      }}>
        <h1>Create a student account</h1>
        {error && <div className="flash">{error}</div>}
        <label>Name <input name="name" required maxLength={80} /></label>
        <label>Email <input type="email" name="email" required /></label>
        <label>Password <input type="password" name="password" required minLength={6} /></label>
        <button type="submit">Create account</button>
        <p className="note">Already registered? <Link to="/login">Sign in</Link>.</p>
      </form>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useUser();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === "instructor" ? "/teach" : user.role === "admin" ? "/admin" : "/"} replace /> : <Login setUser={setUser} />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register setUser={setUser} />} />
      <Route element={<Shell user={user} setUser={setUser} />}>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/journey" element={<Journey />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CoursePage user={user} />} />
        <Route path="/lessons/:id" element={<LessonPage user={user} />} />
        <Route path="/questions" element={<QuestionBank />} />
        <Route path="/exams" element={<Exams />} />
        <Route path="/exams/:id" element={<ExamRoom />} />
        <Route path="/admin" element={<Admin user={user} />} />
        <Route path="/teach" element={<Teach user={user} />} />
        <Route path="/teach/:id" element={<Manage user={user} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
