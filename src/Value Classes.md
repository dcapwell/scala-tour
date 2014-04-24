# Value Classes

In java you had primative types (`int`, `long`, `double`, `float`, etc.) and their wrapper objects (`Integer`, `Long`, `Double`, `Float`, etc.).  "Autoboxing" was the process of the java compiler to switch back and forth between a object and a primative depending on the context.  You had no way of taking advantage of this autoboxing in your own types.  Thats where value classes comes in!

```scala
class Foo(val name: String) extends AnyVal {
  def print = println(name)
}
```

The above is simple, but very powerful.  Lets go over it more in detail

```scala
class Foo(val name: String)
```

The first part of this statement is like any normal class.  There are a few things to call out that make this class different from others: name is `val` and class takes exactly one paramater, and no case statement in front of class.

The next part

```scala
extends AnyVal
```

is how we let scala know that we are creating a value class.

The rest of the statement looks like any other class

```scala
{
  def print = println(name)
}
```

we define a method print that will take the value of name and pass it to println.

So whats so special here?  What scala will do for us is replace code that talks to `Foo` directly and replace them with function calls.  Lets try looking at javap to see if this gets more clear.

```scala
:javap Foo
public final class Foo extends java.lang.Object{
    public java.lang.String name();
    public void print();
    public int hashCode();
    public boolean equals(java.lang.Object);
    public Foo(java.lang.String);
}
```

There is nothing special here, this looks like very other reference type.  So how does scala remove the reference to Foo for the callers?  By sending them to the companion object.

```scala
:javap Foo$
public class Foo$ extends java.lang.Object{
    public static final Foo$ MODULE$;
    public static {};
    public final void print$extension(java.lang.String);
    public final int hashCode$extension(java.lang.String);
    public final boolean equals$extension(java.lang.String, java.lang.Object);
    public Foo$();
}
```

See the `void print$extension(java.lang.String)` function there?  That function is what scala will select for the caller to try to avoid the object creation overhead.  The `$extension` postfix is given to all methods from the Foo class and has the same logic that the method has, but acts on a argument rather than field/method lookup.

So, why should I care?  This seems more of a microlevel optomisation, so why would I need this?  Well, one nice place to put this is in implicit classes.

```scala
scala> implicit class BetterIntOpt(val value: Int) extends AnyVal {
     | def makeBetter = 42 + value
     | }
defined class BetterIntOpt

scala> 1 makeBetter
res0: Int = 43

scala> :javap BetterIntOpt$
Compiled from "<console>"
public class BetterIntOpt$ extends java.lang.Object{
    public static final BetterIntOpt$ MODULE$;
    public static {};
    public final int makeBetter$extension(int);
    public final int hashCode$extension(int);
    public final boolean equals$extension(int, java.lang.Object);
    public BetterIntOpt$();
}
```

When the compile see `1 makeBetter` it will rewrite it out as `BetterIntOpt$.makeBetter$extension(1)` and skip the object creation.
