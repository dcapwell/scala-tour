# Type Classes
Type classes are a functional way to get inheritence like behavior and polymorphism without relying on inheritence.  The core idea for type classes is that you seperate the behavior from the class that gets effected by it.  Before going into type classes in scala, lets go over type classes in java.

```java
public interface Comparator<T> {
    int compare(T o1, T o2);
}

public interface Comparable<T> {
    public int compareTo(T o);
}
```
Most people will be familiar with `Comparator` and `Comparable` if they have dealt with collection sorting and/or `TreeMap`.  When working with sorting a collection, you tell the sort method how to compare items together and then `sort` will use that to determine order.

```java
Collections.sort(myArray, oddNumbersFirst)
```
This basic idea gives the developer using these apis flexability with how to reuse them.  In the above example, the array is placing all odd numbers first.

## The Scala Way
In scala, there is short hand for this kind of behavior; implicits.  Lets go over the example above in a more scala friendly way.
```scala
trait Comparator[T] {
    def compare(t1: T, t2: T): Int
}
// Think of T <: Comparable[T] as weird syntax for "the implementing type"
trait Comparable[T <: Comparable[T]] { self: T =>
    def compareTo(t2: T)(implicit comp: Comparator[T]): Int = comp.compare(self, t2)
}
```
The main change between the `Comparable` here and the java one above is that it relies on `Comparator` implicitly.  How would this look like to the user?
```scala
class Age(val age: Int) extends Comparable[Age]
object Age {
    def apply(age: Int): Age = new Age(age)

    implicit val naturalAgeComparator: Comparator[Age] = new Comparator[Age] {
        def compare(t1: Age, t2: Age): Int = t1.age - t2.age
    }
}
import Age._
Age(1) compareTo Age(2) // -1
Age(1) compareTo Age(1) // 0
// Age(1) compareTo 1 // won't compile
```
As we see, the user no longer needs to care about providing a `Comparator` since the compiler will do that for us.  If we want to override and use a different one, we are still free to (unlike the java one).
```scala
Age(1).compareTo(Age(2))(Age.naturalAgeComparator) // -1
```
## Taking It Further
Now that we see the core idea, can we find more places where they can come in handy?  One easy one is to provide a type safe equals method!
```scala
trait Equal[A] {
    def equal(a1: A, a2: A): Boolean
}

// acts like the Comparable trait, but doesn't rely on extending the trait
implicit class EqualOpt[A](val self: A) extends AnyVal {
    def ===(a2: A)(implicit eq: Equal[A]): Boolean = eq.equal(self, a2)
    def =/=(a2: A)(implicit eq: Equal[A]): Boolean = !eq.equal(self, a2)
}

class Foo(val name: String)
object Foo {
    def apply(name: String): Foo = new Foo(name)
    implicit val naturalEqual: Equal[Foo] = new Equal[Foo] {
        def equal(a1: Foo, a2: Foo): Boolean = a1.name == a2.name
    }
}
import Foo._
Foo("hi") === Foo("there") // returns false
Foo("hi") === Foo("hi") // returns true
// Foo("hi") === "1" // compiler rejects this
```
What about serialization to json, protobuf, etc.?
```scala
trait Serialize[T, O] {
    def serialize(t: T): O
}
implicit class SerializeOpt[A](val self: A) extends AnyVal {
    def serialize[O](implicit ser: Serialize[A, O]): O = ser.serialize(self)
}

class Node(val value: String)
object Node {
    type Json = String
    type Length = Int
    implicit val jsonSer: Serialize[Node, Json] = new Serialize[Node, Json] {
        def serialize(t: Node): Json = s"{'value': '${t.value}'}"
    }
    implicit val lengthSer: Serialize[Node, Length] = new Serialize[Node, Length] {
        def serialize(t: Node): Length = t.value.length
    }
}
import Node._
new Node("hi").serialize[Json] // {'value': 'hi'}
new Node("hi").serialize[Length] // 2
```
