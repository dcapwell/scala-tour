# Phantom Type
Have you ever worked with objects that could be in different states: open/closed, started/stopped, etc?  How many times have you forgot to check what state the object was in before working with it (I have tried to write to sockets that where closed way too many times)?  Ever wondered if you could move these checks into something that gets enforced other than wrapping it around a monad?  Thats where phantom types come in.

A phantom type is a type that is not instantiate ever.  Instead of an object using the type directly, the type is used to enforce some logic.  Lets look at file handles to help explain this.

```scala
val fh = open("/tmp/foo.txt")
...
fh.close
...
fh.write("please be open") // may fail some times cause fh has been closed.
```

Lets make writing to files type safe in regards to closed state.

```scala
sealed trait FileState
final class Opened extends FileState
final class Closed extends FileState

trait FileHandle[State <: FileState] {
    def write[T >: State <: Opened](line: String): Unit
    def close: FileHandle[Closed]
}
```

Here we define a `FileState` that can be either `Opened` or `Closed`.  We have marked each method with the type that it can work with: `write` only works if the `FileHandle` is opened, `close` will mark the `FileHandle` as `Closed`.

Lets see what happens when we try to `write` to a `Closed` file.

```scala
// open a filehandle
def open(path: String): FileHandle[Opened] = new FileHandle[Opened] {
    def write[Opened](line: String): Unit = println(line)
    def close: FileHandle[Closed] = this.asInstanceOf[FileHandle[Closed]]
}

val fh = open("/tmp/foo.txt")
fh.write("bar")

val fh2 = fh.close
fh2.write("rejected son!")
<console>:41: error: inferred type arguments [Closed] do not conform to method write's type parameter bounds [T >: Closed <: Opened]
              fh2.write("rejected son!")
                  ^
```

As we see here, the compiler will reject writing to files that are already closed!  But could the user try to break this?

```scala
scala> val fh3: FileHandle[FileState] = fh.close
<console>:39: error: type mismatch;
 found   : FileHandle[Closed]
 required: FileHandle[FileState]
Note: Closed <: FileState, but trait FileHandle is invariant in type State.
You may wish to define State as +State instead. (SLS 4.5)
       val fh3: FileHandle[FileState] = fh.close
                                           ^
```

Even if we could get from `Closed` to `FileState` we wouldn't be able to get to `Openeded`, so writing will still not be possible.
