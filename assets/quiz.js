// Shared retrieval-practice quiz component for lessons.
// Usage: <div class="quiz-q" data-answer="the answer text">
//          <p class="prompt">Question?</p>
//          <input type="text"><button onclick="checkQuiz(this)">Check</button>
//          <div class="reveal">Explanation shown after checking.</div>
//        </div>
function checkQuiz(button) {
  const q = button.closest(".quiz-q");
  const reveal = q.querySelector(".reveal");
  reveal.classList.add("shown");
  button.disabled = true;
}
