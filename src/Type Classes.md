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
Most people will be familiar with Comparator and Comparable if they have dealt with collection sorting and/or TreeMap.  When working with sorting a collection, you tell the sort method how to compare items together and then sort will use that to determine order.

```java
Collections.sort(myArray, oddNumbersFirst)
```
This basic idea gives the developer using these apis flexability with how to reuse them.  In the above example, the array is placing all odd numbers first.

## Taking it further
In scala, there is short hand for this kind of behavior; implicits.  Lets go over the example above in a more scala friendly way.
```scala
trait Comparator[T] {
    def compare(t1: T, t2: T): Int
}
trait Comparable[T <: Comparable[T]] { self =>
    def compareTo(t2: T)(implicit comp: Comparator[T]): Int = comp(self, t2)
}
```
The main change between the `Comparable` here and the java one above is that it relies on `Comparator` implicitly.  How would this look like to the user?
```scala
case class Foo(name: String) with Comparable[Foo]
object Foo {
    implicit val naturalComparator = new Comparator[Foo] {
        def compare(t1: Foo, t2: Foo): Int = String.naturalComparator(t1.name, t2.name)
    }
}

List(Foo("david"), Foo("john")).sorted
```
As we see, the user no longer needs to care about providing a comparator since the compiler will do that for us.  If we want to override and use a different one, we are still free to.
```scala
List(Foo("david"), Foo("john")).sorted(reverse(Foo.naturalComparator))
```
