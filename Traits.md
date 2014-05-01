# Traits
To the average java programmer, traits are fancy interfaces with defaults (java 8!).  But in scala traits are far more powerful than java 8's interface with default.  Lets start exploring the power of traits.

Simple trait; same as interface

```scala
trait Foo {
    def foo: String
}
```

```java
public interface Foo {
    public String foo();
}
```

Nothing fancy here.  They both seem to be the same thing, and thats because they are.  Lets look at javap for the scala output.

```scala
scala> :javap Foo
Compiled from "<console>"
public interface Foo{
    public abstract java.lang.String foo();
}
```

So whats the big deal?  Traits start to differ from interfaces with defaults when you start defining implementations and mixing in.  Lets look at defining behavior.

```scala
trait Bar {
    def bar: String
    def echo = println(bar)
}
```

```java
public interface Bar {
    public String bar();
    public default void echo()  {
        System.out.println(this.bar())
    }
}
```

This looks very similar, but there is one big difference between the two: java's block goes away if overriden, so code reuse is not possible, scala's implementation of this uses a utility class to store the implementation.  This utility class can be reused and mixed into your code however you wish.  Lets take a look at the generated code from scala.

```scala
scala> :javap -p Bar
Compiled from "<console>"
public interface Bar{
    public abstract java.lang.String bar();
    public abstract void echo();
}
```

Bar looks the same as before, but now there is a new utility class generated: `Bar$class`.

```scala
scala> :javap -p Bar$class
Compiled from "<console>"
public abstract class Bar$class extends java.lang.Object{
    public static void echo(Bar);
    public static void $init$(Bar);
}
```

The `Bar$class` generated is a class with only static methods defined from the trait.  If a class extends the trait, it would look like the following.

```java
// couldn't find a way to do this in scala (scala cant find the type), so doing it in java
public class MyBar implements Bar {
    public String bar() {
        return "bar"
    }
    public void echo()  {
        Bar$class.echo(this);
    }
}
```

Because code reuse of defaults is something that is desired, java 8 offers a solution to this by telling people to use static methods in default blocks.

```java
public static class Bars {
    private Bar() {}

    public static void echo(Bar bar) {
        System.out.println(bar);
    }
}
public interface Bar {
    public String bar();
    public default void echo()  {
        Bars.echo(this);
    }
}
```

By doing the above, you get the same generated code that scala has (s/s/$class/).  So great, we have the same thing right?  Lets try mixing in behaviors.

## Mixins
In the java 8 based world, if you have the interface `Bar` and you want to add in new functionality, its up to you to define how thats done.  Lets try making echo use default echo and a logger echo.

```java
public class MyBar implements Bar {
    public void echo() {
        Bars.echo(this);
        Bars.log(this);
    }
}
```

This seems ok, but to the consumer of `MyBar`, they won't know what is happening or that I have done this.  Scala view to how to do this is with types and mixing behaviors together (this is a common idea in functional programming; types should describe whats going on).

```scala
trait BarLogger extends Bar {
    abstract override def echo = {
        super.echo
        println(s"[LOGGER]: $bar")
    }
}
```

Now lets mix these two together.

```scala
case class BarWorld(bar: String) extends Bar with BarLogger
BarWorld("world").echo
world
[LOGGER]: world
```

With this, we are saying that `BarWorld` has type `Bar with BarLogger`.  We are using the type system to explain what the behavior of `BarWorld` will be.  In this example `BarLogger` is decorating the `Bar` with new behavior.

In java 8, default interfaces are just interfaces, so couldn't I do the same?

```java
class BarWorld implements Bar, BarLogger {
    public String bar() { return "bar"; }
}
```

The code above won't compile.

```java
java: class BarWorld inherits unrelated defaults for echo() from types Bar and BarLogger
```

Java's view of mixins are over disjoin behaviors and not over similar behaviors.  In cases like this, its up to the developer to solve what the behavior should be.

```java
public class MyBar implements Bar, BarLogger {
    public void echo() {
        Bars.echo(this);
        Bars.log(this);
    }
}
```

Scala defines a simple rule for how to know what the behavior should be (and if it gets it wrong, just override it): apply from right to left.  Lets show a few examples.

```scala
trait Echoable {
    def echo: Unit
}

trait One extends Echoable {
    override def echo = println("one")
}

trait Two extends Echoable {
    override def echo = println("two")
}

trait Three extends Echoable {
    override def echo = println("three")
}
```

Here we define three top level traits `One`, `Two`, and `Three` that all extend from `Echoable`.  Each one `override`s the `echo` method to be a different behavior.  Lets see how scala's right to left rule picks the behavior we want.

```scala
(new Three with Two with One).echo
// one

(new One with Three with Two).echo
// two

(new Two with One with Three).echo
// three
```

As we see here, the trait defined right most is the one that wins.  In traits, the `override` keyword annotations that this trait defines a fully implementation of a method, and to use it rather than using `super.echo`.  So what if we didn't define `override`?

```scala
trait Printable {
    def print: Unit
}

trait P1 extends Printable {
    def print = println("one")
}

trait P2 extends Printable {
    def print = println("two")
}

(new P1 with P2).print
<console>:11: error: <$anon: P1 with P2> inherits conflicting members:
  method print in trait P1 of type => Unit  and
  method print in trait P2 of type => Unit
(Note: this can be resolved by declaring an override in <$anon: P1 with P2>.)
              (new P1 with P2).print
                   ^
```

As we see above, the behavior is the same as java's (but with a weirder error message).  If the user adds traits that conflict with an implementation and don't annotate how to resolve conflicts, then scala will expect the user to resolve the conflict.

So what was that `abstract override` we saw before?  Lets go over an example to explain it; filtering out the bad word "java".

```scala
trait Speaker {
    def say(word: String) = println(word)
}

new Speaker(){}.say("Are you a java developer!?!")
Are you a java developer!?!
```

In this case we are going to say that "java" is a bad word.  So lets filter it out and convert it to `j***`.

```scala
trait JavaFilter extends Speaker {
    abstract override def say(word: String) = super.say(word.replace("java", "j***"))
}

class Teacher extends Speaker with JavaFilter

val speaker = new Teacher()
speaker.say("Are you a java developer!?!")
// Are you a j*** developer!?!

speaker.say("Are you a JAVA developer!?!")
// Are you a JAVA developer!?!
```

The `abstract override` annotation says that this implementation relies on other implementations in the trait hierarchy.  The trait now has access to `super` (you won't have access to super without it) and lets you control how to decorate the method.  Thats really what `abstract override` tries to do, let traits decorate other traits.  In a java based world, the decorator pattern is normally implemented by a wrapper object that will do some logic than delegate to the wrapped object.  In scala the same thing can be done at the trait level and normally is (types defining behavior).

## Self =>
Now that we see that traits can be mixed into other traits to create new behaviors, is there any way to say that a trait depends on another trait without extending it (abstract override does depend on a bottom trait implementing the base case)?  What about controlling the type of `this`?  This is where `self =>` comes in; self is the object implementing the trait, and as with other objects we can say what the type is.

Simple case, just defining self reference

```scala
trait Foo { self =>
    def doWork: Unit
}
```

Defining self's type

```scala
trait Bar { self: Foo =>
    def doMoreWork: Unit = self.doWork
}
// don't have to use self within the code
trait Bar2 { self: Foo =>
    def doMoreWork: Unit = doWork
}
```

Defining intersection types.

```scala
trait Biz { self: Bar with Foo =>
    def doEvenMoreWork = {
        self.doWork
        self.doMoreWork
    }
}
```

Here we define that the object implementing `Bar` must have also added the type `Foo` to itself.  If that has been done, then we can use self to access the methods defined in other traits.

```scala
object Baz extends Foo with Bar {
    def doWork = println("baz")
}
Baz.doMoreWork
// baz
```

If the user doesn't mixin `Foo` the compiler will reject the type.

```scala
object Baz2 extends Bar {
    def doWork = println("baz")
}
<console>:62: error: illegal inheritance;
 self-type Baz2.type does not conform to Bar's selftype Bar with Foo
       object Baz2 extends Bar {
                           ^
```

The question you might be wondering at this point is "how is this different than just extending?"  Right now we have shown that there really isn't any difference, but what each implies is infact different.  In the above case of `Bar`, we are really saying that `Bar` "requires" `Foo` and adds a method `doMoreWork` but does not define method `doWork`.  If `Bar` extended `Foo`, then it would be saying that `Bar` adds methods `doWork` and `doMoreWork`.  Self really lets you define a traits dependencies.  Lets try to explore this abit more.

### Mixin to predefined classes
Traits are like interfaces in that they can't construct a object on its own.

```scala
import java.util.Properties

trait MyProperties extends Properties

new MyProperties
<console>:61: error: trait MyProperties is abstract; cannot be instantiated
              new MyProperties
                            ^
```

As we see here, traits can extend classes, so can we hack java to let a class extend two classes?

```scala
import java.util.HashMap

trait MyHashMap extends HashMap[String, String]

case class MyClass extends MyHashMap with MyProperties
<console>:64: error: illegal inheritance; superclass HashMap
 is not a subclass of the superclass Properties
 of the mixin trait MyProperties
       case class MyClass extends MyHashMap with MyProperties
                                                 ^
```

Seems like no; if we extend a class, then a trait acts more like an abstract class.  This is to be expected since the JVM doesn't allow this.

Now lets take this idea but add new functionality for properties.

```scala
import java.util.Properties
trait ScalaProperty { self: Properties =>
    def apply(key: String): Option[String] = Option(self.getProperty(key))
}
```

Here we define a trait that depends on properties (`self: Properties =>`) and adds a method apply to it.  Lets use it

```scala
val prop = new Properties with ScalaProperty
prop("missing")
// None
```

Trait mixins are a way to add new behavior to existing types.  This can be done when defining a class or creating a new instance of a class.


Self is much more flexible than extends, namely because self is defining what dependencies the trait has.

So would we ever want to use extends?  YES!  Look at collections apis for a great example of when to use extends; `List` is `Iterable` and `TraversableOnce`.  If the user had to always create a new list and mix in these traits, the api would be hard to use.  Second off, it would require that the user calls new since you can only mixin at object creation time, aka new.

```scala
List(1, 2, 3) with Foo
<console>:1: error: ';' expected but 'with' found.
       List(1, 2, 3) with Foo
                     ^
```

So when picking self vs extends, ask yourself is the functionality being added needed for almost all instances?  Do you own the implementation?  Are there conflicting functionalities that you want to define?
