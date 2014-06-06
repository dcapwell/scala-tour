# Collections

Collections are the biggest points of failure in languages; if you look over the "Java Puzzlers" book, most of the examples are with collections.  This is also true for scala.  The way type inference works, the whole `CanBuildFrom` mess, and Collection Variance (cause you really meant List[Any] right?) all come together to give you wierd "wtf" moments.  Now, lets have some fun!

## Variance Fails

```scala
List(1).toSet()
```

What does the above produce?  If you are thinking `Set(1)` then you are a sain person!.. But wrong!

```scala
scala> List(1).toSet()
res8: Boolean = false
```

What just happened?  Well, lets add some spacing to see if this gets more clear.

```scala
scala> List(1) toSet ()
res9: Boolean = false
```

With spacing it should be more clear what just happened; the langauge failed!

So, what does `()` mean?  Its `Unit`.

```scala
scala> val foo = ()
foo: Unit = ()
```

So what happened was this: a `List(1)` gets created, gets converted to `Set(1)`, then `contains` was called with `Unit` (cause `apply` is a pointer to `contains` for `Set`).

But wait, `Set` is defined as

```scala
trait Set[A]

scala> Set(1) contains ()
<console>:8: error: not enough arguments for method contains: (elem: Int)Boolean.
Unspecified value parameter elem.
              Set(1) contains ()
```

So how did we get here?  Its `toSet` that did this!

```scala
def toSet[B >: A]: immutable.Set[B] = to[immutable.Set].asInstanceOf[immutable.Set[B]]
```

The above lets `B` fall all the way down to `Any`.  Why would you ever want this?  Who knows!

```scala
scala> val fail : Set[Any] = List(1) toSet
warning: there were 1 feature warning(s); re-run with -feature for details
fail: Set[Any] = Set(1)
```

So when you mix `()` being both function apply and unit together as the same tokens, then you sprinkle variance into things it doesn't belong with (hence the `asInstanceOf` cast...) you get weird behaviors that make no sense!

Rule of thumb with the conversion calls... always give a type on the left hand side to get past this stuff (try not to cast when you can).

## Lazy Fails

In a functional programming language, you would expect that a lot of operations are lazy and interactions with immutable types are also lazy.  Scala doesn't follow this and picks and chooses when things are lazy but doesn't document them, which leads to weird behaviors.

```scala
val i = Seq(1, 2, 3, 4, 5).iterator
val a = i.take(2).toSeq
val b = i.take(2).toSeq

a.foreach(println)
b.foreach(println)
```

What do you think happens here?  First thing I expected was either `1 2` then `3 4` or `1 2` then `1 2` (thinking iterator was lazy and only did work when toSeq was called).  If you thought the same, then you would also be wrong!  Lets see what this does.

```scala
scala> val i = Seq(1, 2, 3, 4, 5).iterator
i: Iterator[Int] = non-empty iterator

scala> val a = i.take(2).toSeq
a: Seq[Int] = Stream(1, ?)

scala> val b = i.take(2).toSeq
b: Seq[Int] = Stream(2, ?)

scala> a.foreach(println)
1
3

scala> b.foreach(println)
2
4
```

The call to `toSeq` will return a `Stream[Int]` back.  The way that `Stream` works is that the first argument must be evaludated, but the next one is lazy.  This means that we pluck the `1` out of the iterator and place it in the `Stream`.  When then repeat this process, but with `2` (the next element in the list).  Lets go to the docs!

```scala
/** Creates a new iterator over all elements contained in this iterable object.
 *
 *  @return the new iterator
 */
def iterator: Iterator[A]
```

and

```scala
// TraversableOnce

def toSeq: Seq[A] = toStream

/** Converts this $coll to a stream.
 *  $willNotTerminateInf
 *  @return a stream containing all elements of this $coll.
 */
def toStream: Stream[A]
```

Thats cool, we don't get a doc for this, so the behavior is undefined!  You have to look at the source code to figure out why it does what it does.
