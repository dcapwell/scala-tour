# Memoization
Some times a function takes too long to run so we want to cache it.  This is a common pattern in functional programming and a very simple mechanism was developed: Memo.

```scala
def longRunning(input: Int): Int = {
    Thread.sleep(1000) // takes a long time!
    input * input
}
def timed[U](work: => U): U = {
    val startTime = System.currentTimeMillis()
    val data = work
    val endTime = System.currentTimeMillis()
    println(s"Timed(${endTime - startTime}): ${data}")
    data
}

val longRunningMemo = Memo.immutableHashMapMemo(longRunning)
timed(longRunningMemo(1))
// 1000ms
timed(longRunningMemo(1))
// 0ms
timed(longRunningMemo(2))
// 999ms
timed(longRunningMemo(2))
// 0ms
```
