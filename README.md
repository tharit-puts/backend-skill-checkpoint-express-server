# AskHub API — Q&A RESTful API

RESTful API สำหรับระบบถาม-ตอบ (Q&A) พัฒนาด้วย Express.js และ PostgreSQL รองรับการจัดการคำถาม คำตอบ และการโหวตแบบ upvote/downvote

โปรเจกต์นี้เป็นส่วนหนึ่งของ Backend Skill Checkpoint

---

## สารบัญ

- [ฟีเจอร์](#ฟีเจอร์)
- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [การติดตั้ง](#การติดตั้ง)
- [โครงสร้างฐานข้อมูล](#โครงสร้างฐานข้อมูล)
- [API Endpoints](#api-endpoints)
  - [Questions](#questions)
  - [Answers](#answers)
  - [Votes](#votes)
- [รูปแบบ Response](#รูปแบบ-response)
- [การทดสอบด้วย Postman](#การทดสอบด้วย-postman)
- [หมายเหตุการออกแบบ](#หมายเหตุการออกแบบ)

---

## ฟีเจอร์

- **จัดการคำถาม** — สร้าง ดูทั้งหมด ดูรายตัว แก้ไข และลบคำถาม
- **ค้นหาคำถาม** — ค้นหาจาก title หรือ category แบบ partial match (ไม่สนตัวพิมพ์เล็ก-ใหญ่)
- **จัดการคำตอบ** — สร้างและดูคำตอบของแต่ละคำถาม รวมถึงลบคำตอบ
- **ระบบโหวต** — โหวตคำถามและคำตอบด้วยค่า `1` (upvote) หรือ `-1` (downvote)
- **จัดกลุ่ม route ด้วย Express Router** — แยก router ตาม resource พร้อม nested router สำหรับ answers
- **Validation และ error handling** — ตรวจสอบข้อมูลก่อนเข้าถึงฐานข้อมูล และคืน HTTP status code ที่เหมาะสม

---

## เทคโนโลยีที่ใช้

| เทคโนโลยี | เวอร์ชัน | หน้าที่ |
| --- | --- | --- |
| Node.js | 18+ | JavaScript runtime (ใช้ ES Modules) |
| Express | ^4.22.2 | Web framework |
| PostgreSQL | 14+ | ฐานข้อมูล |
| node-postgres (pg) | ^8.22.0 | PostgreSQL client พร้อม connection pool |
| nodemon | ^3.1.14 | Auto-reload ระหว่างพัฒนา |

---

## โครงสร้างโปรเจกต์

```
backend-skill-checkpoint-express-server/
├── app.mjs                 # จุดเริ่มต้นของแอป: ตั้งค่า middleware และ mount router
├── routes/
│   ├── questions.mjs       # Router ของ /questions (CRUD, search, vote คำถาม)
│   └── answers.mjs         # Nested router ของ /questions/:questionId/answers
├── utils/
│   └── db.mjs              # PostgreSQL connection pool
├── package.json
└── README.md
```

การจัดกลุ่ม route ทำงานเป็น 2 ชั้น:

```
app.mjs
  └── app.use("/questions", questionRouter)
        ├── /              → POST, GET
        ├── /search        → GET
        ├── /:id           → GET, PUT, DELETE
        ├── /:questionId/votes → POST
        └── questionRouter.use("/:questionId/answers", answerRouter)
              ├── /                    → POST, GET
              ├── /:answerId           → DELETE
              └── /:answerId/votes     → POST
```

`answerRouter` ถูกสร้างด้วย `Router({ mergeParams: true })` เพื่อให้เข้าถึงค่า `:questionId` จาก router แม่ได้

---

## การติดตั้ง

### 1. ข้อกำหนดเบื้องต้น

- Node.js เวอร์ชัน 18 หรือใหม่กว่า
- PostgreSQL ที่รันอยู่และเข้าถึงได้

### 2. Clone และติดตั้ง dependencies

```bash
git clone https://github.com/tharit-puts/backend-skill-checkpoint-express-server.git
cd backend-skill-checkpoint-express-server
npm install
```

### 3. เตรียมฐานข้อมูล

สร้างฐานข้อมูลชื่อ `askhub` แล้วสร้างตารางตาม [โครงสร้างฐานข้อมูล](#โครงสร้างฐานข้อมูล) ด้านล่าง

### 4. ตั้งค่าการเชื่อมต่อ

แก้ connection string ใน `utils/db.mjs` ให้ตรงกับฐานข้อมูลของคุณ:

```js
const connectionPool = new Pool({
  connectionString: "postgresql://user:password@localhost:5432/askhub",
});
```

### 5. รันเซิร์ฟเวอร์

```bash
npm run start
```

เซิร์ฟเวอร์จะรันที่ `http://localhost:4000` และ nodemon จะ reload ให้อัตโนมัติเมื่อแก้ไฟล์

ทดสอบว่าเซิร์ฟเวอร์ทำงานได้ด้วย:

```bash
GET http://localhost:4000/test
```

---

## โครงสร้างฐานข้อมูล

ฐานข้อมูลประกอบด้วย 4 ตาราง

### `questions`

| คอลัมน์ | ชนิดข้อมูล | คำอธิบาย |
| --- | --- | --- |
| `id` | integer | Primary key |
| `title` | varchar | หัวข้อคำถาม |
| `description` | text | รายละเอียดคำถาม |
| `category` | varchar | หมวดหมู่ |

### `answers`

| คอลัมน์ | ชนิดข้อมูล | คำอธิบาย |
| --- | --- | --- |
| `id` | integer | Primary key |
| `question_id` | integer | อ้างอิงถึง `questions.id` |
| `content` | text | เนื้อหาคำตอบ |

### `question_votes`

| คอลัมน์ | ชนิดข้อมูล | คำอธิบาย |
| --- | --- | --- |
| `id` | integer | Primary key |
| `question_id` | integer | อ้างอิงถึง `questions.id` |
| `vote` | integer | `1` หรือ `-1` |

### `answer_votes`

| คอลัมน์ | ชนิดข้อมูล | คำอธิบาย |
| --- | --- | --- |
| `id` | integer | Primary key |
| `answer_id` | integer | อ้างอิงถึง `answers.id` |
| `vote` | integer | `1` หรือ `-1` |

---

## API Endpoints

Base URL: `http://localhost:4000`

ทุก endpoint ที่รับ body ต้องส่งเป็น JSON พร้อม header `Content-Type: application/json`

### Questions

#### สร้างคำถามใหม่

```
POST /questions
```

**Request body**

```json
{
  "title": "What is the capital of France?",
  "description": "I am curious about the capital city of France.",
  "category": "Geography"
}
```

**Responses**

| Status | เงื่อนไข | Response |
| --- | --- | --- |
| `201 Created` | สร้างสำเร็จ | `{ "message": "Question created successfully.", "data": { ... } }` |
| `400 Bad Request` | ข้อมูลไม่ครบ | `{ "message": "Invalid request data." }` |
| `500 Internal Server Error` | ฐานข้อมูลผิดพลาด | `{ "message": "Unable to create question." }` |

---

#### ดูคำถามทั้งหมด

```
GET /questions
```

**Responses**

| Status | เงื่อนไข | Response |
| --- | --- | --- |
| `200 OK` | สำเร็จ | `{ "message": "Questions fetched successfully.", "data": [ ... ] }` |
| `500 Internal Server Error` | ฐานข้อมูลผิดพลาด | `{ "message": "Unable to fetch questions." }` |

---

#### ค้นหาคำถาม

```
GET /questions/search?title=<keyword>&category=<keyword>
```

ค้นหาแบบ partial match และไม่สนตัวพิมพ์เล็ก-ใหญ่ (ใช้ `ILIKE`) ส่ง `title` หรือ `category` มาอย่างน้อย 1 ตัว ถ้าส่งทั้งคู่จะค้นแบบ **OR**

**ตัวอย่าง**

```
GET /questions/search?title=capital
GET /questions/search?category=Geography
GET /questions/search?title=capital&category=Geography
```

**Responses**

| Status | เงื่อนไข | Response |
| --- | --- | --- |
| `200 OK` | สำเร็จ (แม้ไม่พบผลลัพธ์ `data` จะเป็น `[]`) | `{ "message": "Questions fetched successfully.", "data": [ ... ] }` |
| `400 Bad Request` | ไม่ส่ง `title` และ `category` เลย | `{ "message": "Invalid search parameters." }` |
| `500 Internal Server Error` | ฐานข้อมูลผิดพลาด | `{ "message": "Unable to fetch questions." }` |

---

#### ดูคำถามรายตัว

```
GET /questions/:id
```

**Responses**

| Status | เงื่อนไข | Response |
| --- | --- | --- |
| `200 OK` | พบคำถาม | `{ "message": "Question fetched successfully.", "data": { ... } }` |
| `404 Not Found` | ไม่พบคำถาม | `{ "message": "Question not found." }` |
| `500 Internal Server Error` | ฐานข้อมูลผิดพลาด | `{ "message": "Unable to fetch question." }` |

---

#### แก้ไขคำถาม

```
PUT /questions/:id
```

**Request body**

```json
{
  "title": "What is the capital of France?",
  "description": "Updated description.",
  "category": "Geography"
}
```

**Responses**

| Status | เงื่อนไข | Response |
| --- | --- | --- |
| `200 OK` | แก้ไขสำเร็จ | `{ "message": "Question updated successfully.", "data": { ... } }` |
| `400 Bad Request` | ข้อมูลไม่ครบ | `{ "message": "Invalid request data." }` |
| `404 Not Found` | ไม่พบคำถาม | `{ "message": "Question not found." }` |
| `500 Internal Server Error` | ฐานข้อมูลผิดพลาด | `{ "message": "Unable to update question." }` |

---

#### ลบคำถาม

```
DELETE /questions/:id
```

**Responses**

| Status | เงื่อนไข | Response |
| --- | --- | --- |
| `200 OK` | ลบสำเร็จ | `{ "message": "Question post has been deleted successfully." }` |
| `404 Not Found` | ไม่พบคำถาม | `{ "message": "Question not found." }` |
| `500 Internal Server Error` | ฐานข้อมูลผิดพลาด | `{ "message": "Unable to delete question." }` |

---

### Answers

#### สร้างคำตอบของคำถาม

```
POST /questions/:questionId/answers
```

**Request body**

```json
{
  "content": "The capital of France is Paris."
}
```

**Responses**

| Status | เงื่อนไข | Response |
| --- | --- | --- |
| `201 Created` | สร้างสำเร็จ | `{ "message": "Answer created successfully.", "data": { ... } }` |
| `400 Bad Request` | ไม่ส่ง `content` | `{ "message": "Invalid request data." }` |
| `404 Not Found` | ไม่พบคำถาม | `{ "message": "Question not found." }` |
| `500 Internal Server Error` | ฐานข้อมูลผิดพลาด | `{ "message": "Unable to create answer." }` |

---

#### ดูคำตอบทั้งหมดของคำถาม

```
GET /questions/:questionId/answers
```

**Responses**

| Status | เงื่อนไข | Response |
| --- | --- | --- |
| `200 OK` | สำเร็จ | `{ "message": "Answers fetched successfully.", "data": [ ... ] }` |
| `404 Not Found` | ไม่พบคำถาม | `{ "message": "Question not found." }` |
| `500 Internal Server Error` | ฐานข้อมูลผิดพลาด | `{ "message": "Unable to fetch answers." }` |

---

#### ลบคำตอบ

```
DELETE /questions/:questionId/answers/:answerId
```

คำตอบที่ลบต้องเป็นของคำถามนั้นจริง (ตรวจทั้ง `question_id` และ `id`)

**Responses**

| Status | เงื่อนไข | Response |
| --- | --- | --- |
| `200 OK` | ลบสำเร็จ | `{ "message": "Answer deleted successfully.", "data": { ... } }` |
| `404 Not Found` | ไม่พบคำตอบของคำถามนี้ | `{ "message": "Answer not found." }` |
| `500 Internal Server Error` | ฐานข้อมูลผิดพลาด | `{ "message": "Unable to delete answer." }` |

---

### Votes

#### โหวตคำถาม

```
POST /questions/:questionId/votes
```

**Request body**

```json
{ "vote": 1 }
```

ค่า `vote` ต้องเป็นตัวเลข `1` (upvote) หรือ `-1` (downvote) เท่านั้น

**Responses**

| Status | เงื่อนไข | Response |
| --- | --- | --- |
| `200 OK` | บันทึกสำเร็จ | `{ "message": "Vote on the question has been recorded successfully.", "data": { ... } }` |
| `400 Bad Request` | `vote` ไม่ใช่ `1` หรือ `-1` | `{ "message": "Invalid request data." }` |
| `404 Not Found` | ไม่พบคำถาม | `{ "message": "Question not found." }` |
| `500 Internal Server Error` | ฐานข้อมูลผิดพลาด | `{ "message": "Unable to vote question." }` |

---

#### โหวตคำตอบ

```
POST /questions/:questionId/answers/:answerId/votes
```

**Request body**

```json
{ "vote": -1 }
```

**Responses**

| Status | เงื่อนไข | Response |
| --- | --- | --- |
| `200 OK` | บันทึกสำเร็จ | `{ "message": "Vote on the answer has been recorded successfully.", "data": { ... } }` |
| `400 Bad Request` | `vote` ไม่ใช่ `1` หรือ `-1` | `{ "message": "Invalid request data." }` |
| `404 Not Found` | ไม่พบคำตอบของคำถามนี้ | `{ "message": "Answer not found." }` |
| `500 Internal Server Error` | ฐานข้อมูลผิดพลาด | `{ "message": "Unable to vote answer." }` |

---

## รูปแบบ Response

ทุก response เป็น JSON และมี key `message` เสมอ ส่วน `data` จะมีเฉพาะกรณีที่มีข้อมูลส่งกลับ

**สำเร็จ**

```json
{
  "message": "Question fetched successfully.",
  "data": {
    "id": 1,
    "title": "What is the capital of France?",
    "description": "I am curious about the capital city of France.",
    "category": "Geography"
  }
}
```

**ผิดพลาด**

```json
{
  "message": "Question not found."
}
```

### สรุป HTTP status code ที่ใช้

| Status | ความหมาย |
| --- | --- |
| `200 OK` | ดึงข้อมูล แก้ไข ลบ หรือโหวตสำเร็จ |
| `201 Created` | สร้างข้อมูลใหม่สำเร็จ |
| `400 Bad Request` | ข้อมูลที่ส่งมาไม่ถูกต้องหรือไม่ครบ |
| `404 Not Found` | ไม่พบข้อมูลที่ระบุ |
| `500 Internal Server Error` | เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์หรือฐานข้อมูล |

---

## การทดสอบด้วย Postman

### ตั้งค่า request

1. เลือก HTTP method และใส่ URL
2. สำหรับ `POST` และ `PUT` ให้ไปที่แท็บ **Body** เลือก **raw** แล้วเลือกชนิดเป็น **JSON**
3. กด **Send**

### ตัวอย่างการทดสอบตามลำดับ

ทดสอบตามลำดับนี้เพื่อให้ได้ `id` ไปใช้ในขั้นถัดไป

```
1. POST   /questions                                → จด id ของคำถามที่ได้ (เช่น 5)
2. GET    /questions/5
3. POST   /questions/5/answers                      → จด id ของคำตอบที่ได้ (เช่น 12)
4. GET    /questions/5/answers
5. POST   /questions/5/votes                        body: { "vote": 1 }
6. POST   /questions/5/answers/12/votes             body: { "vote": -1 }
7. PUT    /questions/5
8. DELETE /questions/5/answers/12
9. DELETE /questions/5
```

### ข้อควรระวัง

- **`vote` ต้องเป็นตัวเลข ไม่ใช่ string** — โค้ดเทียบค่าแบบเข้มงวด (`!==`) ดังนั้น `{"vote": "1"}` จะได้ `400`
- **ต้องเลือก Body เป็น raw + JSON** — ถ้าเลือก `form-data` หรือ `x-www-form-urlencoded` ตัว `express.json()` จะอ่าน body ไม่ได้ ทำให้ได้ `400` แม้กรอกข้อมูลครบ
- **`answerId` ต้องเป็นคำตอบของ `questionId` นั้นจริง** — ถ้าสลับกันจะได้ `404` แม้คำตอบนั้นมีอยู่ในฐานข้อมูล

---

## หมายเหตุการออกแบบ

### ลำดับการประกาศ route มีความสำคัญ

`GET /questions/search` ต้องประกาศ **ก่อน** `GET /questions/:id` เพราะ Express จับคู่ route ตามลำดับจากบนลงล่าง ถ้าประกาศ `/:id` ไว้ก่อน คำว่า `search` จะถูกตีความเป็นค่า `id` แล้วไม่มีทางเข้าถึง handler ของการค้นหาได้เลย

### การ validate เกิดขึ้นก่อนเข้าถึงฐานข้อมูล

ทุก handler ตรวจสอบความถูกต้องของ input ก่อนยิง query เพื่อให้คืน `400` ได้อย่างถูกต้อง แทนที่จะปล่อยให้ query ล้มเหลวแล้วกลายเป็น `500`

### การตรวจว่ามีข้อมูลอยู่จริงก่อนคืน 404

การเช็คว่า resource มีอยู่จริงใช้การตรวจจำนวนแถวที่ได้จาก query (`result.rows.length === 0`) ไม่ใช่การเช็คว่า path parameter มีค่าหรือไม่ เพราะ `req.params` จะมีค่าเสมอเมื่อ route ถูก match แล้ว

คำสั่ง `UPDATE` และ `DELETE` ใช้ `RETURNING *` เพื่อให้รู้ว่ามีแถวถูกกระทำจริงหรือไม่ ทำให้แยกกรณี `200` กับ `404` ได้ถูกต้อง

### การป้องกัน SQL Injection

ทุก query ใช้ parameterized query (`$1`, `$2`, ...) แทนการต่อ string ค่าที่รับจากผู้ใช้ รวมถึง endpoint ค้นหาที่สร้างเงื่อนไขแบบไดนามิก ซึ่งต่อเฉพาะโครงสร้างของ SQL ส่วนค่าที่ค้นหายังส่งผ่าน parameter เสมอ
