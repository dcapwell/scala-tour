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

This looks very similar, but there is one big difference between the two: java's block goes away if overriden, so code reuse is not possible, scala's implementation of this is as a companion object that lets you reuse if you want.  Lets show this example.

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

Because code reuse of defaults is something that is wanted, java 8 offers a solution to this by telling people to use static methods in default blocks.

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

By doing the above, you get the same generated code that scala has (s/s/$class/g).  So great, we have the same thing right?  Lets try mixing in behaviors.

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

This seems ok, but to the consumer of `MyBar`, they won't know what is happening or that I have done this.  Scala view to how to do this is with types and mixing behaviors together (this is a common idea in functional programming; types should say whats going on).

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

With this, we are saying that `BarWorld` has type `Bar with BarLogger`.  We are using the type system to explain what the behavior of `BarWorld` will be.

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

Java's view of mixins are over distjoin behaviors and not over similar behaviors.  In cases like this, its up to the developer to solve what the behavior should be.

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

(new Three with Two with One).echo
// one

(new One with Three with Two).echo
// two

(new Two with One with Three).echo
// three
```

Here we use the `override` keyword to say we don't care about any other implementation, use mine.  If the `override` keyword is omitted then the behavior is just like java's.

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

So what was that `abstract override` we saw before?  Its a way to say that different traits can both define the behavior.  The right most trait runs first, then left, then left, etc.  Lets go over a example bad word filtering.

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

With mixins we are able to do the decorator pattern that we did in java, but at the interface level.
