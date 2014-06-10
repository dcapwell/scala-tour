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

## Iterable

Coming from java, you know that working with iterables is a great way to make functions more reusable, but there are cases where this becomes unsafe in scala: Set.

```scala
def sumSizes(collections: Iterable[TraversableOnce[_]]): Int = collections.map(_.size).sum

sumSizes(List(Set(1, 2), List(3, 4)))
sumSizes(Set(List(1, 2), Set(3, 4)))
```

When `Set` is used and mapped over, the output gets uniqued.  This means that the result above is 4 then 2.

## Map Fails

Remember in Functor, the laws?  They are Composition and Identity.  You would expect that these laws hold true with the scala collections, right?

WRONG!

```scala
import scala.collection._
val f: Int => Int = _ % 3
val g: Int => Int = _ => System.nanoTime % 1000000 toInt

Set(3, 6, 9) map f map g
Set(3, 6, 9) map (f andThen g)
```

If you run the code above, you get the following output

```scala
scala> Set(3, 6, 9) map f map g
res11: scala.collection.Set[Int] = Set(679000)

scala> Set(3, 6, 9) map (f andThen g)
res12: scala.collection.Set[Int] = Set(842000, 845000, 848000)
```

The resulting sets are not equal!

Ok, so they broke composition but identity should be fine, right?

WRONG!

```scala
import scala.collection._
BitSet(1, 2, 3) map (_.toString.toInt)
BitSet(1, 2, 3) map (_.toString) map (_.toInt)
(BitSet(1, 2, 3) map identity)(1)
```

If you run the above, you see that the result types are different depending on if you compose functions before calling map, but the last statement is scary!  Identity failed us!

```scala
scala> (BitSet(1, 2, 3) map identity)(1)
<console>:14: error: type mismatch;
 found   : Int(1)
 required: scala.collection.generic.CanBuildFrom[scala.collection.BitSet,Int,?]
              (BitSet(1, 2, 3) map identity)(1)
```

Ok, in scala's defence, if you split the map and the apply into different statements, it does what you expect.

```scala
val org = BitSet(1, 2, 3) map identity
org(1)
// true
```


```scala
def f[T](x: T) = (x, new Object)

val set = SortedSet(1 to 10: _*)

set map (x => f(x)._1)

set map f map (_._1)
```

## Type Safe Methods

As we saw with type classes, we can build very type safe methods on objects (remember type safe equals?).  You would assume that scala's collections are type safe and won't compile if what you ask is not logical.

```scala
List(1, 2, 3) contains "your mom"
```

The above will output `false`.  This will always happen since a `List[Int]` can never contain a type `String`.  The reason for this is the same reason the above is also valid in java.  Here is the def.

```scala
def contains(elem: Any): Boolean
```

So I throw away the type to check if something contains...
